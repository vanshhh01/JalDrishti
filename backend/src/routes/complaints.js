import express from 'express';
import prisma from '../prisma.js';
import { analyzeWaterPhoto } from '../services/aiService.js';
import { findAndAssignNearestTeam } from '../services/teamService.js';

const router = express.Router();

/**
 * POST /api/complaints/analyze-photo
 * Body: { photoBase64 }
 * Analyzes photo with AI Vision and returns generated description, urgency, and department BEFORE submitting
 */
router.post('/analyze-photo', async (req, res) => {
  try {
    const { photoBase64 } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ error: 'Photo is required for AI analysis.' });
    }

    const aiAnalysis = await analyzeWaterPhoto(photoBase64);

    if (aiAnalysis.isWaterRelated === false) {
      return res.status(400).json({
        error: aiAnalysis.rejectionReason || 'The uploaded photo does not appear to show a water issue or pipeline problem. Please upload a clear photo of the water problem.',
        isInvalidPhoto: true
      });
    }

    res.json({
      success: true,
      aiInsights: aiAnalysis
    });
  } catch (error) {
    console.error('Error analyzing photo with AI:', error);
    res.status(500).json({ error: 'Failed to analyze photo with AI', details: error.message });
  }
});

/**
 * POST /api/complaints
 * Body: { name, photoBase64, description, urgency, department, aiReasoning, latitude, longitude, address }
 */
router.post('/', async (req, res) => {
  try {
    const { name, photoBase64, description: userDescription, urgency: customUrgency, department: customDept, aiReasoning: customReasoning, latitude, longitude, address } = req.body;

    if (!photoBase64) {
      return res.status(400).json({ error: 'Photo is required.' });
    }

    const citizenName = name?.trim() || 'Citizen';

    // If description/urgency already generated from preview, use them; otherwise analyze now
    let aiAnalysis = {
      description: userDescription,
      urgency: customUrgency,
      department: customDept,
      aiReasoning: customReasoning,
      isWaterRelated: true
    };

    if (!userDescription || !customUrgency || !customDept) {
      aiAnalysis = await analyzeWaterPhoto(photoBase64, userDescription);
      if (aiAnalysis.isWaterRelated === false) {
        return res.status(400).json({
          error: aiAnalysis.rejectionReason || 'The uploaded photo does not appear to show a water issue. Please upload a clear photo of the water problem.',
          isInvalidPhoto: true
        });
      }
    }

    const lat = parseFloat(latitude) || 28.6475;
    const lng = parseFloat(longitude) || 77.3150;
    const finalDescription = userDescription || aiAnalysis.description || 'Reported water infrastructure issue.';
    const finalUrgency = customUrgency || aiAnalysis.urgency || 'Medium';
    const finalDept = customDept || aiAnalysis.department || 'Leak Repair';

    // Save complaint into Database
    const complaint = await prisma.complaint.create({
      data: {
        citizenName: citizenName,
        photoUrl: photoBase64,
        clarityScore: 80,
        clarityLabel: 'Detected',
        aiReasoning: customReasoning || aiAnalysis.aiReasoning,
        description: finalDescription,
        urgency: finalUrgency,
        department: finalDept,
        latitude: lat,
        longitude: lng,
        address: address || 'Municipal Ward Area, Delhi NCR',
        status: 'Assigned'
      }
    });

    // Auto-assign nearest field crew across Delhi, Ghaziabad, and Noida
    const teamAssignment = await findAndAssignNearestTeam(complaint);

    // Refetch complaint with assigned team details
    const updatedComplaint = await prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: {
        citizen: true,
        assignedTeam: true
      }
    });

    const complaintRefId = `JD-${complaint.id.slice(0, 8).toUpperCase()}`;

    res.status(201).json({
      success: true,
      complaintRefId,
      complaint: updatedComplaint,
      assignedTeam: teamAssignment?.team || null,
      distanceKm: teamAssignment?.distanceKm || null,
      aiInsights: aiAnalysis
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to process and analyze complaint', details: error.message });
  }
});

/**
 * GET /api/complaints
 */
router.get('/', async (req, res) => {
  try {
    const { department, urgency, status, search, needsHubReview } = req.query;
    const where = {};

    if (department && department !== 'All') where.department = department;
    if (urgency && urgency !== 'All') where.urgency = urgency;
    if (status && status !== 'All') where.status = status;
    if (needsHubReview === 'true') {
      where.status = 'Needs Hub Verification';
    }
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { address: { contains: search } },
        { id: { contains: search } }
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        citizen: true,
        assignedTeam: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/complaints/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: true,
        assignedTeam: true,
        notifications: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/complaints/:id/status
 * Body: { status } - "Assigned" | "In Progress" | "Resolved"
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Assigned', 'In Progress', 'Resolved', 'Needs Hub Verification'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: { status },
      include: { citizen: true, assignedTeam: true }
    });

    res.json({
      success: true,
      complaint: updated
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/complaints/:id/hub-verify
 * Main Municipal Hub officer reviews ambiguous After-photo and either approves or requests re-work
/**
 * POST /api/complaints/:id/hub-verify
 * Municipal Hub officer reviews ambiguous After-photo and either approves work or enforces re-work
 */
router.post('/:id/hub-verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, officerNotes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { citizen: true, assignedTeam: true }
    });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (decision === 'Approved') {
      // 1. Human Officer Approves the Work and Closes the Complaint
      const updated = await prisma.complaint.update({
        where: { id },
        data: {
          status: 'Resolved',
          hubReviewStatus: 'Approved',
          resolvedAt: new Date(),
          resolutionNotes: `Verified & Approved by Municipal Officer. Notes: ${officerNotes || 'Field repair inspected and accepted. Pipeline restored to normal operation.'}`
        },
        include: { citizen: true, assignedTeam: true }
      });

      // 2. Notify Citizen via SMS
      await prisma.notification.create({
        data: {
          complaintId: id,
          type: 'SMS',
          recipient: complaint.citizenPhone || complaint.citizen?.phone || 'Citizen',
          message: `🎉 Great News! Your reported water issue #${id.slice(0, 8).toUpperCase()} has been reviewed and APPROVED by the Municipal Officer. Case marked as Resolved.`
        }
      });

      // 3. Free up team if no other active jobs
      if (complaint.assignedTeamId) {
        const otherActive = await prisma.complaint.count({
          where: {
            assignedTeamId: complaint.assignedTeamId,
            id: { not: id },
            status: { in: ['Assigned', 'In Progress', 'Needs Hub Verification'] }
          }
        });

        if (otherActive === 0) {
          await prisma.municipalTeam.update({
            where: { id: complaint.assignedTeamId },
            data: { status: 'Available' }
          });
        }
      }

      return res.json({ 
        success: true, 
        complaint: updated,
        message: 'Complaint successfully approved and closed as Resolved.' 
      });
    }

    // Otherwise: Enforce Re-work to field crew
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'In Progress',
        hubReviewStatus: 'Rejected',
        resolutionNotes: `Re-Work Enforced by Municipal Officer. Reason: ${officerNotes || 'After photo inconclusive or ambiguous. Field crew must re-inspect, arrest defect completely, and upload clear photo.'}`
      },
      include: { citizen: true, assignedTeam: true }
    });

    if (complaint.assignedTeamId) {
      await prisma.notification.create({
        data: {
          complaintId: id,
          teamId: complaint.assignedTeamId,
          type: 'TEAM_ALERT',
          recipient: complaint.assignedTeam?.name,
          message: `⚠️ Re-Work Required for #${id.slice(0, 8).toUpperCase()}: Officer rejected repair photo. Reason: ${officerNotes || 'Repair visual proof inconclusive'}. Please rectify on-site and re-upload photo.`
        }
      });
    }

    return res.json({ 
      success: true, 
      complaint: updated,
      message: 'Re-work order dispatched to field crew.' 
    });
  } catch (error) {
    console.error('Error in hub verification:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/complaints/:id
 * Removes a complaint and associated notifications
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if complaint exists
    const existing = await prisma.complaint.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.json({
        success: true,
        message: 'Complaint already removed or not found.'
      });
    }

    // Clean up notifications safely
    try {
      await prisma.notification.deleteMany({
        where: { complaintId: id }
      });
    } catch (notifErr) {
      console.warn('Notification cleanup note:', notifErr.message);
    }

    const deleted = await prisma.complaint.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Complaint #${id.slice(0, 8).toUpperCase()} deleted successfully.`,
      deleted
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/complaints/:id/reassign
 * Reassigns complaint to another municipal team or updates urgency/department
 */
router.patch('/:id/reassign', async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTeamId, urgency, department } = req.body;

    const data = {};
    if (assignedTeamId) data.assignedTeamId = assignedTeamId;
    if (urgency) data.urgency = urgency;
    if (department) data.department = department;

    const updated = await prisma.complaint.update({
      where: { id },
      data,
      include: { citizen: true, assignedTeam: true }
    });

    if (assignedTeamId) {
      await prisma.notification.create({
        data: {
          complaintId: id,
          teamId: assignedTeamId,
          type: 'TEAM_ALERT',
          recipient: updated.assignedTeam?.name || 'Field Crew',
          message: `🔄 Ticket #${id.slice(0, 8).toUpperCase()} reassigned to your unit by Central Municipal Hub.`
        }
      });
    }

    res.json({ success: true, complaint: updated });
  } catch (error) {
    console.error('Error reassigning complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
