import prisma from '../prisma.js';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest municipal team in Delhi, Ghaziabad, or Noida
 * matching the department (or closest available team) and auto-assigns the complaint.
 */
export async function findAndAssignNearestTeam(complaint) {
  try {
    const teams = await prisma.municipalTeam.findMany();
    if (!teams || teams.length === 0) {
      console.warn('[Team Dispatch] No municipal teams registered in system.');
      return null;
    }

    const { latitude, longitude, department, address, urgency } = complaint;

    // Filter by matching department first, or fallback to any team if no exact match
    let candidateTeams = teams.filter(
      (t) => t.department === department || t.department === 'General'
    );
    if (candidateTeams.length === 0) {
      candidateTeams = teams;
    }

    // Rank candidates by distance
    const rankedTeams = candidateTeams.map((team) => {
      const distance = calculateDistanceKm(latitude, longitude, team.latitude, team.longitude);
      return { team, distance };
    });

    rankedTeams.sort((a, b) => a.distance - b.distance);

    const nearest = rankedTeams[0];
    const assignedTeam = nearest.team;
    const distanceKm = nearest.distance;

    // Link team to complaint
    await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        assignedTeamId: assignedTeam.id,
        status: 'Assigned'
      }
    });

    // Update team status to Dispatched
    await prisma.municipalTeam.update({
      where: { id: assignedTeam.id },
      data: { status: 'Dispatched' }
    });

    // Create Team Notification
    await prisma.notification.create({
      data: {
        complaintId: complaint.id,
        teamId: assignedTeam.id,
        type: 'TEAM_ALERT',
        recipient: assignedTeam.name,
        message: `🚨 New ${urgency} Issue Assigned: ${complaint.description.slice(0, 75)}... at ${address || 'Assigned Location'} (~${distanceKm} km away).`
      }
    });

    // Create Citizen SMS Notification
    await prisma.notification.create({
      data: {
        complaintId: complaint.id,
        type: 'SMS',
        recipient: complaint.citizenPhone || complaint.citizen?.phone || 'Citizen',
        message: `📲 Update on #${complaint.id.slice(0, 8).toUpperCase()}: Nearest field crew "${assignedTeam.name}" (${assignedTeam.area}, ${assignedTeam.city}) has been dispatched to your location (~${distanceKm} km away). Contact: ${assignedTeam.phone || 'Toll-free 1916'}.`
      }
    });

    console.log(
      `[Team Dispatch] Complaint #${complaint.id.slice(0, 8)} assigned to nearest team: "${assignedTeam.name}" in ${assignedTeam.city} (${distanceKm} km away)`
    );

    return {
      team: assignedTeam,
      distanceKm
    };
  } catch (error) {
    console.error('[Team Dispatch Error]:', error);
    return null;
  }
}

export const DEFAULT_MUNICIPAL_TEAMS = [
  // DELHI TEAMS
  {
    name: 'Delhi Central Quick Response Unit #1',
    city: 'Delhi',
    area: 'Connaught Place & Central Circle',
    department: 'Leak Repair',
    phone: '9810112233',
    status: 'Available',
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

export async function autoSeedMunicipalTeams() {
  try {
    const count = await prisma.municipalTeam.count();
    if (count === 0) {
      console.log('🔄 MunicipalTeam table is empty. Auto-seeding 10 quick response teams across Delhi, Ghaziabad & Noida...');
      for (const t of DEFAULT_MUNICIPAL_TEAMS) {
        await prisma.municipalTeam.create({ data: t });
      }
      console.log('✅ Auto-seeded 10 municipal teams successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Auto-seed municipal teams warning:', err.message);
  }
}
