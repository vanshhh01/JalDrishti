import express from 'express';
import prisma from '../prisma.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Returns recent simulated notifications feed
 */
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        complaint: true
      }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/:complaintId
 */
router.get('/:complaintId', async (req, res) => {
  try {
    const { complaintId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { complaintId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
