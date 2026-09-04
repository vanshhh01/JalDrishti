import express from 'express';
import prisma from '../prisma.js';
import { verifyRepairBeforeAfter } from '../services/aiService.js';
import { calculateDistanceKm, autoSeedMunicipalTeams } from '../services/teamService.js';

const router = express.Router();

/**
 * GET /api/teams
 * Returns all municipal field teams with active ticket counts
 */
router.get('/', async (req, res) => {
  try {
    const { city, department } = req.query;
    const where = {};
    if (city && city !== 'All') where.city = city;
    if (department && department !== 'All') where.department = department;

    let teams = await prisma.municipalTeam.findMany({
      where,
      include: {
        complaints: {
          where: {
            status: { in: ['Assigned', 'In Progress', 'Needs Hub Verification'] }
          },
          select: { id: true, urgency: true, status: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Self-healing: if empty, auto-seed and re-query
    if (teams.length === 0 && (!city || city === 'All') && (!department || department === 'All')) {
      await autoSeedMunicipalTeams();
      teams = await prisma.municipalTeam.findMany({
        include: {
          complaints: {
            where: {
              status: { in: ['Assigned', 'In Progress', 'Needs Hub Verification'] }
            },
            select: { id: true, urgency: true, status: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    }

    const formatted = teams.map((team) => ({
      ...team,
      activeComplaintsCount: team.complaints ? team.complaints.length : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/teams/:id
 * Returns a specific team with its active and past complaints and notifications
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const team = await prisma.municipalTeam.findUnique({
      where: { id },
      include: {
        complaints: {
          include: { citizen: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!team) return res.status(404).json({ error: 'Municipal team not found' });

    // Fetch team notifications
    const notifications = await prisma.notification.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Add calculated distance for complaints relative to team home coordinates
    const complaintsWithDistance = team.complaints.map((c) => ({
      ...c,
      distanceFromBaseKm: calculateDistanceKm(team.latitude, team.longitude, c.latitude, c.longitude)
    }));

    res.json({
      team: {
        ...team,
        complaints: complaintsWithDistance
      },
      notifications
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/teams/:id/complaints/:complaintId/start-work
 * Field team marks assigned complaint as "In Progress"
 */
router.patch('/:id/complaints/:complaintId/start-work', async (req, res) => {
  try {
    const { id: teamId, complaintId } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { citizen: true }
    });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: 'In Progress' },
      include: { citizen: true, assignedTeam: true }
    });

    await prisma.municipalTeam.update({
      where: { id: teamId },
      data: { status: 'Busy' }
    });

    // Notify citizen that crew is actively repairing
    await prisma.notification.create({
      data: {
        complaintId,
        type: 'STATUS_UPDATE',
        recipient: complaint.citizenPhone || complaint.citizen?.phone || 'Citizen',
        message: `🔧 Field Crew "${updated.assignedTeam?.name || 'Municipal Team'}" has arrived on site and started repair work.`
      }
    });

    res.json({ success: true, complaint: updated });
  } catch (error) {
    console.error('Error starting work:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/teams/:id/complaints/:complaintId/complete-work
 * Field team uploads After-repair photo.
 * Multimodal AI verifies Before vs After.
 * If verified -> Resolved; if doubtful/lighting/angle issues -> Needs Hub Verification.
 */
router.post('/:id/complaints/:complaintId/complete-work', async (req, res) => {
  try {
    const { id: teamId, complaintId } = req.params;
    const { afterPhotoBase64, resolutionNotes } = req.body;

    if (!afterPhotoBase64) {
      return res.status(400).json({ error: 'After-repair photo is required for resolution.' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { citizen: true, assignedTeam: true }
    });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    console.log(`[AI Verification] Starting Before vs After analysis for complaint #${complaintId.slice(0, 8)}...`);

    // Run Multimodal AI verification
    const aiVerification = await verifyRepairBeforeAfter({
      beforePhoto: complaint.photoUrl,
      afterPhoto: afterPhotoBase64,
      complaintDescription: complaint.description,
      department: complaint.department
    });

    console.log('[AI Verification Result]:', aiVerification);

    let nextStatus = 'Resolved';
    let verificationResult = 'AI_APPROVED';
    let hubStatus = 'Approved';
    let resolvedDate = new Date();

    if (aiVerification.requiresHubReview || aiVerification.confidenceScore < 70) {
      nextStatus = 'Needs Hub Verification';
      verificationResult = 'NEEDS_HUB_REVIEW';
      hubStatus = 'Pending';
      resolvedDate = null;

      // Create Municipal Hub Alert Notification
      await prisma.notification.create({
        data: {
          complaintId,
          type: 'SYSTEM',
          recipient: 'Municipal Hub Officers',
          message: `⚠️ Hub Review Required for #${complaintId.slice(0, 8).toUpperCase()}: AI flagged camera angle / lighting ambiguity (${aiVerification.confidenceScore}% confidence). Field team "${complaint.assignedTeam?.name}" waiting for sign-off.`
        }
      });

      // Notify Team
      await prisma.notification.create({
        data: {
          complaintId,
          teamId,
          type: 'TEAM_ALERT',
          recipient: complaint.assignedTeam?.name,
          message: `⏳ Repair photo for #${complaintId.slice(0, 8).toUpperCase()} submitted. AI flagged angle/lighting variations — Ticket escalated to Central Municipal Hub for manual sign-off.`
        }
      });
    } else {
      // Auto-closed by AI
      // Notify Citizen
      await prisma.notification.create({
        data: {
          complaintId,
          type: 'SMS',
          recipient: complaint.citizenPhone || complaint.citizen?.phone || 'Citizen',
          message: `🎉 Great News! Your reported water issue #${complaintId.slice(0, 8).toUpperCase()} has been repaired and verified by AI. Water quality & pressure restored.`
        }
      });

      // Free up team if no other active jobs
      const otherActive = await prisma.complaint.count({
        where: {
          assignedTeamId: teamId,
          id: { not: complaintId },
          status: { in: ['Assigned', 'In Progress'] }
        }
      });

      if (otherActive === 0) {
        await prisma.municipalTeam.update({
          where: { id: teamId },
          data: { status: 'Available' }
        });
      }
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: nextStatus,
        afterPhotoUrl: afterPhotoBase64,
        resolutionNotes: resolutionNotes || 'Repairs completed by field maintenance crew.',
        resolvedAt: resolvedDate,
        aiConfidence: aiVerification.confidenceScore,
        aiVerificationResult: verificationResult,
        aiVerificationNotes: aiVerification.aiVerificationNotes,
        hubReviewStatus: hubStatus
      },
      include: { citizen: true, assignedTeam: true }
    });

    res.json({
      success: true,
      complaint: updatedComplaint,
      aiVerification
    });
  } catch (error) {
    console.error('Error completing work:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/teams/:id/notifications
 */
router.get('/:id/notifications', async (req, res) => {
  try {
    const { id } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { teamId: id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
