const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // AI Photo Pre-Scan Analysis
  async analyzePhoto(photoBase64) {
    const res = await fetch(`${API_BASE}/complaints/analyze-photo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoBase64 }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze photo with AI');
    }
    return data;
  },

  // Complaints
  async createComplaint(data) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to submit complaint');
    return resData;
  },

  async getComplaints(filters = {}) {
    const params = new URLSearchParams();
    if (filters.department && filters.department !== 'All') params.append('department', filters.department);
    if (filters.urgency && filters.urgency !== 'All') params.append('urgency', filters.urgency);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    if (filters.needsHubReview) params.append('needsHubReview', 'true');
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  async getComplaintById(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) throw new Error('Failed to fetch complaint details');
    return res.json();
  },

  async updateComplaintStatus(id, status) {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  async deleteComplaint(id) {
    const res = await fetch(`${API_BASE}/complaints/${id}`, {
      method: 'DELETE',
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to delete complaint');
    return resData;
  },

  async reassignComplaint(id, data) {
    const res = await fetch(`${API_BASE}/complaints/${id}/reassign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to reassign complaint');
    return resData;
  },

  // Municipal Hub Verification (Approve or Reject doubtful after-repair photos)
  async verifyHubComplaint(id, decision, officerNotes) {
    const res = await fetch(`${API_BASE}/complaints/${id}/hub-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, officerNotes }),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to verify complaint');
    return resData;
  },

  // Municipal Field Teams
  async getTeams(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city && filters.city !== 'All') params.append('city', filters.city);
    if (filters.department && filters.department !== 'All') params.append('department', filters.department);

    const res = await fetch(`${API_BASE}/teams?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch municipal teams');
    return res.json();
  },

  async getTeamById(id) {
    const res = await fetch(`${API_BASE}/teams/${id}`);
    if (!res.ok) throw new Error('Failed to fetch team workspace');
    return res.json();
  },

  async startTeamWork(teamId, complaintId) {
    const res = await fetch(`${API_BASE}/teams/${teamId}/complaints/${complaintId}/start-work`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to start repair work');
    return resData;
  },

  async completeTeamWork(teamId, complaintId, data) {
    const res = await fetch(`${API_BASE}/teams/${teamId}/complaints/${complaintId}/complete-work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || 'Failed to complete repair work');
    return resData;
  },

  async getTeamNotifications(teamId) {
    const res = await fetch(`${API_BASE}/teams/${teamId}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch team alerts');
    return res.json();
  },

  // Public Transparency & Showcase
  async getPublicStatsAndShowcase() {
    const res = await fetch(`${API_BASE}/public/stats-showcase`);
    if (!res.ok) throw new Error('Failed to fetch public stats and showcase');
    return res.json();
  }
};
