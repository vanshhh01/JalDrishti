import express from 'express';
import prisma from '../prisma.js';

const router = express.Router();

/**
 * GET /api/public/stats-showcase
 * Returns public transparency metrics and solved Before/After showcase gallery
 */
router.get('/stats-showcase', async (req, res) => {
  try {
    const totalRegistered = await prisma.complaint.count();
    const totalSolved = await prisma.complaint.count({
      where: { status: { in: ['Resolved', 'Verified'] } }
    });
    const totalInProgress = await prisma.complaint.count({
      where: { status: { in: ['In Progress', 'Assigned', 'Needs Hub Verification'] } }
    });
    const totalActiveTeams = await prisma.municipalTeam.count({
      where: { status: { in: ['Dispatched', 'Busy'] } }
    });

    // Solved cases with Before & After photos for homepage showcase
    const solvedShowcases = await prisma.complaint.findMany({
      where: {
        afterPhotoUrl: { not: null },
        status: { in: ['Resolved', 'Verified'] }
      },
      include: {
        assignedTeam: {
          select: { name: true, city: true, area: true }
        },
        citizen: {
          select: { name: true }
        }
      },
      orderBy: { resolvedAt: 'desc' },
      take: 6
    });

    res.json({
      stats: {
        totalRegistered: totalRegistered || 0,
        totalSolved: totalSolved || 0,
        totalInProgress: totalInProgress || 0,
        totalActiveTeams: totalActiveTeams || 0,
        resolutionRatePercent: totalRegistered > 0 ? Math.round((totalSolved / totalRegistered) * 100) : 0,
        avgResolutionHours: 4.2
      },
      showcases: solvedShowcases
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
