import React, { useState, useMemo, useEffect } from 'react';
import { 
  Map as MapIcon, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Droplets, 
  MapPin, 
  Flame, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Truck, 
  Trash2, 
  Wrench,
  Layers
} from 'lucide-react';
import GisMap from './GisMap';
import ComplaintDetailsModal from './ComplaintDetailsModal';
import ErrorBoundary from './ErrorBoundary';
import { api } from '../services/api';

const DEPARTMENTS = ['All', 'Leak Repair', 'Water Quality', 'Water Supply', 'Sewage-Drainage', 'Billing-Meter'];
const CITIES = ['All', 'Delhi', 'Ghaziabad', 'Noida'];

export default function StaffDashboard({
  complaints = [],
  onRefresh = () => {},
  onDeleteComplaint,
  isLoading = false
}) {
  // Main Tabs: 'complaints' | 'map' | 'rework' | 'teams'
  const [activeTab, setActiveTab] = useState('complaints');
  
  // Complaints section view: 'all' | 'Assigned' | 'In Progress' | 'Resolved'
  const [complaintSection, setComplaintSection] = useState('all');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Teams list
  const [teams, setTeams] = useState([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Re-work input note
  const [reworkNotes, setReworkNotes] = useState({});
  const [isSendingRework, setIsSendingRework] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setIsTeamsLoading(true);
    try {
      const data = await api.getTeams();
      setTeams(data || []);
    } catch (err) {
      console.error('Teams load error:', err);
    } finally {
      setIsTeamsLoading(false);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];

  // Simple quick counts
  const counts = useMemo(() => {
    const total = safeComplaints.length;
    const solved = safeComplaints.filter(c => c.status === 'Resolved').length;
    const working = safeComplaints.filter(c => c.status === 'In Progress').length;
    const assigned = safeComplaints.filter(c => c.status === 'Assigned').length;
    const needsRework = safeComplaints.filter(c => c.status === 'Needs Hub Verification').length;
    return { total, solved, working, assigned, needsRework };
  }, [safeComplaints]);

  // Filter complaints cleanly
  const filtered = useMemo(() => {
    return safeComplaints.filter(c => {
      if (!c) return false;
      const q = searchQuery.toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const addr = (c.address || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const team = (c.assignedTeam?.name || '').toLowerCase();
      const city = (c.assignedTeam?.city || '').toLowerCase();

      const matchesSearch = !q || desc.includes(q) || addr.includes(q) || id.includes(q) || team.includes(q);
      const matchesDept = selectedDept === 'All' || c.department === selectedDept;
      const matchesCity = selectedCity === 'All' || city.includes(selectedCity.toLowerCase()) || addr.includes(selectedCity.toLowerCase());

      return matchesSearch && matchesDept && matchesCity;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [safeComplaints, searchQuery, selectedDept, selectedCity]);

  // Split into 3 distinct sections
  const assignedComplaints = useMemo(() => filtered.filter(c => c.status === 'Assigned'), [filtered]);
  const inProgressComplaints = useMemo(() => filtered.filter(c => c.status === 'In Progress'), [filtered]);
  const solvedComplaints = useMemo(() => filtered.filter(c => c.status === 'Resolved'), [filtered]);

  // Needs Re-Work complaints (AI doubted after-photo)
  const reworkComplaints = useMemo(() => {
    return safeComplaints.filter(c => c.status === 'Needs Hub Verification');
  }, [safeComplaints]);

  // Delete complaint handler
  const handleDelete = async (e, complaintId) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const shortId = complaintId.slice(0, 8).toUpperCase();
    if (!window.confirm(`Delete complaint #${shortId}?`)) return;

    try {
      if (onDeleteComplaint) {
        await onDeleteComplaint(complaintId);
      } else {
        await api.deleteComplaint(complaintId);
        await onRefresh();
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Human Officer Hub Verification (Approve or Re-work)
  const handleHubVerify = async (complaintId, decision, customNote = '') => {
    setIsSendingRework(true);
    try {
      const note = customNote || reworkNotes[complaintId] || (decision === 'Approved' ? 'Inspected and verified on-site by officer.' : 'Photo unclear or repair incomplete. Please re-check on site.');
      const res = await api.verifyHubComplaint(complaintId, decision, note);
      await onRefresh();
      alert(res.message || (decision === 'Approved' ? 'Work approved and complaint closed as Solved!' : 'Re-work order sent to field team.'));
      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setIsDetailsOpen(false);
        setSelectedComplaint(null);
      }
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setIsSendingRework(false);
    }
  };

  const getPriorityBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-200">Critical</span>;
      case 'High':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700 border border-orange-200">High</span>;
      case 'Medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Solved</span>;
      case 'In Progress':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Team Working</span>;
      case 'Needs Hub Verification':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Needs Re-Work</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Assigned</span>;
    }
  };

  // Reusable card renderer
  const renderComplaintCard = (comp) => (
    <div
      key={comp.id}
      onClick={() => { setSelectedComplaint(comp); setIsDetailsOpen(true); }}
      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-cyan-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
            #JD-{comp.id.slice(0, 8).toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5">
            {getPriorityBadge(comp.urgency)}
            <button
              type="button"
              onClick={(e) => handleDelete(e, comp.id)}
              className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer"
              title="Delete complaint"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {comp.photoUrl && (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img src={comp.photoUrl} alt="Defect" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 line-clamp-2 leading-relaxed">
              {comp.description}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
              <span className="truncate">{comp.address || 'Reported Location'}</span>
            </p>
          </div>
        </div>

        {comp.assignedTeam && (
          <div className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-700 truncate">🚚 {comp.assignedTeam.name}</span>
            <span className="font-bold text-cyan-700 uppercase text-[10px] shrink-0">{comp.assignedTeam.city}</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div>{getStatusBadge(comp.status)}</div>
        <span className="text-[10px] text-slate-400 font-medium">
          {new Date(comp.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. CLEAN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Municipal Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor water issues, track nearest teams, and verify repairs across Delhi, Ghaziabad & Noida
          </p>
        </div>

        <button
          type="button"
          onClick={() => { onRefresh(); loadTeams(); }}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isTeamsLoading ? 'animate-spin text-cyan-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2. SIMPLE STATS COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Reported</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{counts.total}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
          <span className="text-xs font-bold text-blue-700 uppercase">Teams Working</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-900">{counts.working}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase">Solved by AI</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-900">{counts.solved}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
          <span className="text-xs font-bold text-amber-800 uppercase">Needs Re-Work</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900">{counts.needsRework}</p>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'complaints'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Complaints ({filtered.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'map'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Live Map (Active Only)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rework')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rework'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Needs Re-Work ({reworkComplaints.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'teams'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Teams ({teams.length})</span>
        </button>
      </div>

      {/* 4. COMPLAINTS TAB (SPLIT INTO ASSIGNED, IN PROGRESS, AND SOLVED SECTIONS) */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          
          {/* Search, City & Department Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaint, address, or team..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-cyan-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                {CITIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
              </select>

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Section Selector Switcher */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setComplaintSection('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                complaintSection === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Sections ({filtered.length})
            </button>

            <button
              type="button"
              onClick={() => setComplaintSection('Assigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                complaintSection === 'Assigned'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📌 Assigned</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white font-bold text-amber-800">
                {assignedComplaints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setComplaintSection('In Progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                complaintSection === 'In Progress'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛠️ In Progress</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white font-bold text-blue-800">
                {inProgressComplaints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setComplaintSection('Resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                complaintSection === 'Resolved'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>✓ Solved</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white font-bold text-emerald-800">
                {solvedComplaints.length}
              </span>
            </button>
          </div>

          {/* 1. ASSIGNED COMPLAINTS SECTION */}
          {(complaintSection === 'all' || complaintSection === 'Assigned') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Assigned Complaints ({assignedComplaints.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • Waiting for field crew to begin work
                  </span>
                </div>
              </div>

              {assignedComplaints.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                  No assigned complaints waiting for crew.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedComplaints.map(renderComplaintCard)}
                </div>
              )}
            </div>
          )}

          {/* 2. IN PROGRESS COMPLAINTS SECTION */}
          {(complaintSection === 'all' || complaintSection === 'In Progress') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    In Progress Complaints ({inProgressComplaints.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • Field team has arrived and is repairing on-site
                  </span>
                </div>
              </div>

              {inProgressComplaints.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                  No complaints currently in progress.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inProgressComplaints.map(renderComplaintCard)}
                </div>
              )}
            </div>
          )}

          {/* 3. SOLVED COMPLAINTS SECTION */}
          {(complaintSection === 'all' || complaintSection === 'Resolved') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Solved Complaints ({solvedComplaints.length})
                  </h3>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • Verified and confirmed resolved by AI Vision
                  </span>
                </div>
              </div>

              {solvedComplaints.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 text-xs">
                  No solved complaints yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {solvedComplaints.map(renderComplaintCard)}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 5. LIVE MAP TAB (Problems + Teams - Active Only) */}
      {activeTab === 'map' && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-cyan-600" />
                <span>Active Water Problems & Nearest Teams</span>
              </h2>
              <p className="text-xs text-slate-500">Solved complaints are hidden automatically to keep map clean</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filtered.filter(c => c.status !== 'Resolved').length} Active Issues • {teams.length} Teams
            </span>
          </div>

          <ErrorBoundary>
            <GisMap
              complaints={filtered}
              teams={teams}
              onSelectComplaint={(comp) => { setSelectedComplaint(comp); setIsDetailsOpen(true); }}
              selectedComplaintId={selectedComplaint?.id}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* 6. NEEDS HUB VERIFICATION TAB */}
      {activeTab === 'rework' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-extrabold text-amber-950 flex items-center gap-1.5 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Human Officer Inspection Required</span>
            </p>
            <p className="text-amber-800">
              The AI flagged these tickets with lower confidence due to ambiguous angles or lighting. As the municipal officer, you can inspect the Before & After evidence and either <strong>Approve</strong> the repair to close the ticket as Solved, or <strong>Order Re-Work</strong> for the field crew.
            </p>
          </div>

          {reworkComplaints.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
              No tickets currently pending officer verification. All repairs were automatically verified by AI.
            </div>
          ) : (
            <div className="space-y-4">
              {reworkComplaints.map(comp => (
                <div key={comp.id} className="p-5 rounded-2xl bg-white border border-amber-200 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                      #JD-{comp.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-600">
                      Team: <strong>{comp.assignedTeam?.name} ({comp.assignedTeam?.city})</strong>
                    </span>
                  </div>

                  {/* Before & After Side by Side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-red-600 uppercase">Before (Reported Defect)</span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                        <img src={comp.photoUrl} alt="Before" className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-600 uppercase">After (Submitted Photo)</span>
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                        {comp.afterPhotoUrl ? (
                          <img src={comp.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No photo</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong>AI Visual Assessment:</strong>
                      <span className="font-bold text-[11px] px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-900">
                        Confidence: {comp.aiConfidence || 58}%
                      </span>
                    </div>
                    <p>{comp.aiVerificationNotes || 'Photo angle or shadow makes repair doubtful. Needs manual officer sign-off.'}</p>
                  </div>

                  {/* Officer Action Row */}
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Officer notes (e.g., 'Inspected clamp, approved' OR 'Photo shadowed, clean and re-take')..."
                      value={reworkNotes[comp.id] || ''}
                      onChange={(e) => setReworkNotes({ ...reworkNotes, [comp.id]: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={isSendingRework}
                        onClick={() => handleHubVerify(comp.id, 'Approved')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>✓ Approve Work & Close Complaint</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSendingRework}
                        onClick={() => handleHubVerify(comp.id, 'Rejected')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>↺ Need Re-Work (Send Back to Crew)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TEAMS TAB */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-800 uppercase">{team.city}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  team.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  ● {team.status}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{team.name}</h3>
              <p className="text-xs text-slate-500">{team.area}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <span>Specialty: <strong>{team.department}</strong></span>
                <span>📞 {team.phone || '1916'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Inspection Drawer */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onDeleteComplaint={handleDelete}
        onHubVerify={handleHubVerify}
      />

    </div>
  );
}
