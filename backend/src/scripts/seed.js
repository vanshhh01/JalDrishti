import prisma from '../prisma.js';
import { seedConsumptionData } from '../services/analyticsService.js';

// Pre-seeded high quality sample images / SVG data URIs for realistic offline testing
const SAMPLE_BURST_PIPE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230284c7"/><path d="M0 220 Q100 180 200 240 T400 210 L400 300 L0 300 Z" fill="%230369a1"/><path d="M180 220 Q200 80 220 220" stroke="%2338bdf8" stroke-width="12" fill="none"/><text x="50%" y="85%" text-anchor="middle" fill="%23f0f9ff" font-family="sans-serif" font-size="16" font-weight="bold">Major Pipeline Burst Flooding Road</text></svg>';

const SAMPLE_CLEAR_LEAK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230ea5e9"/><circle cx="200" cy="150" r="70" fill="%2338bdf8" opacity="0.8"/><path d="M190 100 L200 60 L210 100 Z" fill="%23bae6fd"/><text x="50%" y="85%" text-anchor="middle" fill="%23f0f9ff" font-family="sans-serif" font-size="16" font-weight="bold">Valve Flange Dripping Clean Potable Water</text></svg>';

// Realistic After-Repair Photos
const SAMPLE_AFTER_FIXED_PIPE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23334155"/><rect x="80" y="130" width="240" height="40" rx="8" fill="%2364748b"/><rect x="170" y="120" width="60" height="60" rx="6" fill="%2306b6d4" stroke="%230891b2" stroke-width="4"/><circle cx="185" cy="150" r="4" fill="%23ffffff"/><circle cx="215" cy="150" r="4" fill="%23ffffff"/><text x="50%" y="85%" text-anchor="middle" fill="%23ecfeff" font-family="sans-serif" font-size="16" font-weight="bold">Repaired Pipe with High-Pressure Clamp</text></svg>';

const SAMPLE_AFTER_AMBIGUOUS = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23475569"/><polygon points="40,240 360,200 330,120 70,140" fill="%231e293b" opacity="0.7"/><ellipse cx="210" cy="180" rx="50" ry="25" fill="%230284c7" opacity="0.5"/><text x="50%" y="85%" text-anchor="middle" fill="%23fef08a" font-family="sans-serif" font-size="15" font-weight="bold">Doubtful Angle - Shadowed Wet Ground</text></svg>';

async function seed() {
  console.log('🌱 Starting clean database seed for JalDrishti (No dummy citizens)...');

  // 1. Clean existing records
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.municipalTeam.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Seed Municipal Field Teams (Delhi, Ghaziabad, Noida)
  const teamsData = [
    // DELHI TEAMS
    {
      name: 'Delhi Central Quick Response Unit #1',
      city: 'Delhi',
      area: 'Connaught Place & Central Circle',
      department: 'Leak Repair',
      phone: '9810112233',
      status: 'Dispatched',
      latitude: 28.6328,
      longitude: 77.2197
    },
    {
      name: 'Delhi North Pipeline Patrol',
      city: 'Delhi',
      area: 'Rohini Sector 14 & Pitampura',
      department: 'Leak Repair',
      phone: '9810223344',
      status: 'Available',
      latitude: 28.7150,
      longitude: 77.1250
    },
    {
      name: 'Delhi South Water Quality Squad',
      city: 'Delhi',
      area: 'Saket & Hauz Khas Zone',
      department: 'Water Quality',
      phone: '9810334455',
      status: 'Available',
      latitude: 28.5244,
      longitude: 77.2167
    },
    {
      name: 'Delhi East Drainage & Supply Unit',
      city: 'Delhi',
      area: 'Laxmi Nagar & Mayur Vihar',
      department: 'Water Supply',
      phone: '9810445566',
      status: 'Available',
      latitude: 28.6300,
      longitude: 77.2773
    },

    // GHAZIABAD TEAMS
    {
      name: 'Ghaziabad Indirapuram Jal Squad',
      city: 'Ghaziabad',
      area: 'Indirapuram & Vaishali Sector 4',
      department: 'Leak Repair',
      phone: '9810556677',
      status: 'Available',
      latitude: 28.6415,
      longitude: 77.3714
    },
    {
      name: 'Ghaziabad Raj Nagar Quick Response',
      city: 'Ghaziabad',
      area: 'Raj Nagar Extension & Kavi Nagar',
      department: 'Water Supply',
      phone: '9810667788',
      status: 'Available',
      latitude: 28.6947,
      longitude: 77.4410
    },
    {
      name: 'Ghaziabad Sahibabad Industrial Division',
      city: 'Ghaziabad',
      area: 'Sahibabad & Mohan Nagar',
      department: 'Sewage-Drainage',
      phone: '9810778899',
      status: 'Available',
      latitude: 28.6725,
      longitude: 77.3482
    },

    // NOIDA TEAMS
    {
      name: 'Noida Sector 62 Rapid Action Team',
      city: 'Noida',
      area: 'Sector 62 IT Park & Electronic City',
      department: 'Leak Repair',
      phone: '9810889900',
      status: 'Available',
      latitude: 28.6271,
      longitude: 77.3653
    },
    {
      name: 'Noida Sector 18 Commercial Leak Division',
      city: 'Noida',
      area: 'Sector 18 Atta Market & Sector 16',
      department: 'Water Quality',
      phone: '9810990011',
      status: 'Available',
      latitude: 28.5708,
      longitude: 77.3219
    },
    {
      name: 'Noida Expressway Water Taskforce',
      city: 'Noida',
      area: 'Sector 137 & Advant Navis Corridor',
      department: 'Leak Repair',
      phone: '9810113355',
      status: 'Available',
      latitude: 28.5085,
      longitude: 77.4080
    }
  ];

  const seededTeams = [];
  for (const t of teamsData) {
    const created = await prisma.municipalTeam.create({ data: t });
    seededTeams.push(created);
  }
  console.log(`🚒 Municipal Teams seeded (${seededTeams.length} teams across Delhi, Ghaziabad & Noida)`);

  // 3. Seed Consumption Zones
  const zones = await seedConsumptionData();
  console.log(`📊 Consumption Zones seeded (${zones.length} zones)`);

  // 4. Seed 3 clean complaints (1 In Progress, 1 Resolved Showcase, 1 Hub Verification)
  const seedComplaints = [
    // 1. Active Case: In Progress (Assigned to Delhi Central Unit)
    {
      citizenName: 'Resident Reporter',
      assignedTeamId: seededTeams[0].id, // Delhi Central
      photoUrl: SAMPLE_BURST_PIPE,
      clarityScore: 84,
      clarityLabel: 'Clear',
      aiReasoning: 'Clean treated municipal water gushing rapidly across carriageway from 8-inch feeder pipeline breach.',
      description: 'Major high-pressure pipe burst near Metro Pillar 42. Roadway partially inundated.',
      urgency: 'Critical',
      department: 'Leak Repair',
      latitude: 28.6335,
      longitude: 77.2205,
      address: 'Outer Circle, Connaught Place, New Delhi',
      status: 'In Progress'
    },
    // 2. Showcase Solved Case: Resolved with Before & After photos (Noida Sector 62 Rapid Action Team)
    {
      citizenName: 'Noida Sector 62 Welfare Association',
      assignedTeamId: seededTeams[7].id, // Noida Sec 62
      photoUrl: SAMPLE_BURST_PIPE,
      afterPhotoUrl: SAMPLE_AFTER_FIXED_PIPE,
      clarityScore: 80,
      clarityLabel: 'Detected',
      aiReasoning: 'Underground joint crack causing road sinkhole.',
      description: 'Underground distribution flange burst flooding service lane near Sector 62 Metro Station.',
      urgency: 'High',
      department: 'Leak Repair',
      latitude: 28.6280,
      longitude: 77.3670,
      address: 'Sector 62 Institutional Area, Noida',
      status: 'Resolved',
      resolutionNotes: 'Fitted 8-inch steel coupling clamp and reinforced trench bedding. Road restored.',
      resolvedAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
      aiConfidence: 94,
      aiVerificationResult: 'AI_APPROVED',
      aiVerificationNotes: 'AI Vision confirmed: Pipeline rupture permanently clamped. Road asphalt dry and no secondary leakage detected.',
      hubReviewStatus: 'Approved'
    },
    // 3. Supervisory Case: Needs Hub Verification (Delhi North)
    {
      citizenName: 'Rohini RWA Member',
      assignedTeamId: seededTeams[1].id, // Delhi North
      photoUrl: SAMPLE_CLEAR_LEAK,
      afterPhotoUrl: SAMPLE_AFTER_AMBIGUOUS,
      clarityScore: 90,
      clarityLabel: 'Clear',
      aiReasoning: 'Street valve box leaking continuously into pedestrian footpath.',
      description: 'Valve packing gland failed, water oozing out near gate entrance.',
      urgency: 'Medium',
      department: 'Leak Repair',
      latitude: 28.7180,
      longitude: 77.1200,
      address: 'Sector 14 Pocket 3, Rohini, Delhi',
      status: 'Needs Hub Verification',
      resolutionNotes: 'Valve tightening attempted by field crew. Uploaded post-maintenance photo.',
      resolvedAt: new Date(Date.now() - 3600000 * 1), // 1 hour ago
      aiConfidence: 58,
      aiVerificationResult: 'NEEDS_HUB_REVIEW',
      aiVerificationNotes: 'Noticeable perspective shift and harsh shadowed lighting obscure the valve flange. The AI detected potential moisture reflections. Escalated to Municipal Hub for manual officer verification.',
      hubReviewStatus: 'Pending'
    }
  ];

  for (const item of seedComplaints) {
    const c = await prisma.complaint.create({ data: item });

    if (c.assignedTeamId) {
      await prisma.notification.create({
        data: {
          complaintId: c.id,
          teamId: c.assignedTeamId,
          type: 'TEAM_ALERT',
          recipient: 'Field Crew',
          message: `🚨 Task #${c.id.slice(0, 8).toUpperCase()}: ${c.description.slice(0, 60)}... at ${c.address}`
        }
      });
    }
  }

  console.log(`✅ Seeded ${seedComplaints.length} clean complaints (0 fake citizens).`);
  console.log('🎉 JalDrishti database successfully populated!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
