import express from 'express';
import { getAllZones, getFlaggedZones, seedConsumptionData } from '../services/analyticsService.js';

const router = express.Router();

/**
 * GET /api/analytics/zones
 * Returns all municipal zones with current consumption, baseline, and deviation statistics
 */
router.get('/zones', async (req, res) => {
  try {
    const data = await getAllZones();
    res.json(data);
  } catch (error) {
    console.error('Error fetching zone analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/analytics/flagged-zones
 * Returns zones where deviationPercent >= 25% (Probable Hidden Leaks)
 */
router.get('/flagged-zones', async (req, res) => {
  try {
    const flagged = await getFlaggedZones();
    res.json(flagged);
  } catch (error) {
    console.error('Error fetching flagged zones:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/analytics/seed
 * Generates realistic synthetic consumption records for municipal wards
 */
router.post('/seed', async (req, res) => {
  try {
    const seededRecords = await seedConsumptionData();
    res.json({
      success: true,
      message: `Successfully seeded ${seededRecords.length} municipal consumption zones with anomaly detection baselines.`,
      zonesCount: seededRecords.length,
      flaggedCount: seededRecords.filter(r => r.flagged).length
    });
  } catch (error) {
    console.error('Error seeding analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
