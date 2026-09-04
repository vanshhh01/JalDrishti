import prisma from '../prisma.js';

// Real-world representative municipal wards (Delhi NCR / Urban City representative)
export const SEED_ZONES = [
  {
    zoneId: 'WARD-01',
    zoneName: 'Ward 1 - Civil Lines North',
    wardNumber: 1,
    currentConsumption: 4.8,
    historicalBaseline: 4.6,
    latitude: 28.6812,
    longitude: 77.2228,
  },
  {
    zoneId: 'WARD-02',
    zoneName: 'Ward 2 - Model Town Industrial Enclave',
    wardNumber: 2,
    currentConsumption: 8.9,
    historicalBaseline: 6.2, // +43.5% deviation -> FLAGGED
    latitude: 28.7025,
    longitude: 77.1934,
  },
  {
    zoneId: 'WARD-03',
    zoneName: 'Ward 3 - Karol Bagh Commercial Hub',
    wardNumber: 3,
    currentConsumption: 5.1,
    historicalBaseline: 5.0,
    latitude: 28.6514,
    longitude: 77.1907,
  },
  {
    zoneId: 'WARD-04',
    zoneName: 'Ward 4 - Anand Vihar Sector 7',
    wardNumber: 4,
    currentConsumption: 7.4,
    historicalBaseline: 5.2, // +42.3% deviation -> FLAGGED
    latitude: 28.6475,
    longitude: 77.3150,
  },
  {
    zoneId: 'WARD-05',
    zoneName: 'Ward 5 - Hauz Khas Residential Area',
    wardNumber: 5,
    currentConsumption: 3.4,
    historicalBaseline: 3.5,
    latitude: 28.5494,
    longitude: 77.2001,
  },
  {
    zoneId: 'WARD-06',
    zoneName: 'Ward 6 - Lajpat Nagar Market Sector',
    wardNumber: 6,
    currentConsumption: 6.8,
    historicalBaseline: 4.9, // +38.8% deviation -> FLAGGED
    latitude: 28.5700,
    longitude: 77.2400,
  },
  {
    zoneId: 'WARD-07',
    zoneName: 'Ward 7 - Dwarka Sector 12 Sub-City',
    wardNumber: 7,
    currentConsumption: 5.8,
    historicalBaseline: 5.6,
    latitude: 28.5921,
    longitude: 77.0460,
  },
  {
    zoneId: 'WARD-08',
    zoneName: 'Ward 8 - Rohini Sector 16 West',
    wardNumber: 8,
    currentConsumption: 9.3,
    historicalBaseline: 6.8, // +36.7% deviation -> FLAGGED
    latitude: 28.7180,
    longitude: 77.1200,
  },
  {
    zoneId: 'WARD-09',
    zoneName: 'Ward 9 - Mayur Vihar Phase 1',
    wardNumber: 9,
    currentConsumption: 4.2,
    historicalBaseline: 4.1,
    latitude: 28.6080,
    longitude: 77.2950,
  },
  {
    zoneId: 'WARD-10',
    zoneName: 'Ward 10 - Janakpuri Block C',
    wardNumber: 10,
    currentConsumption: 4.9,
    historicalBaseline: 4.8,
    latitude: 28.6219,
    longitude: 77.0878,
  }
];

/**
 * Seed municipal consumption records
 */
export async function seedConsumptionData() {
  const records = [];

  for (const zone of SEED_ZONES) {
    const deviation = ((zone.currentConsumption - zone.historicalBaseline) / zone.historicalBaseline) * 100;
    const deviationPercent = Math.round(deviation * 10) / 10;
    const flagged = deviationPercent >= 25.0;
    
    // Calculate water loss in Kilolitres (1 MLD = 1000 KL)
    const excessMLD = Math.max(0, zone.currentConsumption - zone.historicalBaseline);
    const leakEstimateKL = flagged ? Math.round(excessMLD * 1000) : 0;
    
    let pipelineHealth = 'Normal Flow';
    if (deviationPercent >= 35) pipelineHealth = 'Critical Anomaly (Probable Hidden Breach)';
    else if (deviationPercent >= 20) pipelineHealth = 'Moderate Variance (Sensor Review)';

    const record = await prisma.consumptionRecord.upsert({
      where: { zoneId: zone.zoneId },
      update: {
        zoneName: zone.zoneName,
        wardNumber: zone.wardNumber,
        currentConsumption: zone.currentConsumption,
        historicalBaseline: zone.historicalBaseline,
        deviationPercent,
        flagged,
        leakEstimateKL,
        latitude: zone.latitude,
        longitude: zone.longitude,
        pipelineHealth
      },
      create: {
        zoneId: zone.zoneId,
        zoneName: zone.zoneName,
        wardNumber: zone.wardNumber,
        currentConsumption: zone.currentConsumption,
        historicalBaseline: zone.historicalBaseline,
        deviationPercent,
        flagged,
        leakEstimateKL,
        latitude: zone.latitude,
        longitude: zone.longitude,
        pipelineHealth
      }
    });

    records.push(record);
  }

  return records;
}

/**
 * Get all zones with analytics metrics
 */
export async function getAllZones() {
  const zones = await prisma.consumptionRecord.findMany({
    orderBy: { deviationPercent: 'desc' }
  });

  const totalCurrentMLD = zones.reduce((acc, z) => acc + z.currentConsumption, 0);
  const totalBaselineMLD = zones.reduce((acc, z) => acc + z.historicalBaseline, 0);
  const totalEstimatedLeakKL = zones.reduce((acc, z) => acc + (z.leakEstimateKL || 0), 0);
  const flaggedCount = zones.filter(z => z.flagged).length;

  return {
    summary: {
      totalZones: zones.length,
      flaggedZonesCount: flaggedCount,
      totalCurrentMLD: Math.round(totalCurrentMLD * 100) / 100,
      totalBaselineMLD: Math.round(totalBaselineMLD * 100) / 100,
      totalEstimatedLeakKL,
      netLossPercentage: Math.round(((totalCurrentMLD - totalBaselineMLD) / totalBaselineMLD) * 1000) / 10
    },
    zones
  };
}

/**
 * Get only flagged zones (Probable hidden leaks)
 */
export async function getFlaggedZones() {
  return await prisma.consumptionRecord.findMany({
    where: { flagged: true },
    orderBy: { deviationPercent: 'desc' }
  });
}
