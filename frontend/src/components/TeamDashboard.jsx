import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wrench, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Camera, 
  Sparkles, 
  Bell, 
  ArrowRight, 
  ChevronRight, 
  Upload, 
  ShieldAlert, 
  RefreshCw,
  Phone,
  Navigation,
  Check,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

// Realistic sample test images for 1-click testing
const TEST_AFTER_PIPE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23334155"/><rect x="80" y="130" width="240" height="40" rx="8" fill="%2364748b"/><rect x="170" y="120" width="60" height="60" rx="6" fill="%2306b6d4" stroke="%230891b2" stroke-width="4"/><circle cx="185" cy="150" r="4" fill="%23ffffff"/><circle cx="215" cy="150" r="4" fill="%23ffffff"/><text x="50%" y="85%" text-anchor="middle" fill="%23ecfeff" font-family="sans-serif" font-size="16" font-weight="bold">Repaired Pipe with High-Pressure Clamp</text></svg>';

const TEST_AFTER_WATER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f172a"/><rect x="140" y="70" width="120" height="170" rx="12" fill="%2338bdf8" opacity="0.4" stroke="%230284c7" stroke-width="3"/><path d="M145 120 Q200 130 255 120 L255 230 Q200 240 145 230 Z" fill="%2306b6d4" opacity="0.7"/><text x="50%" y="92%" text-anchor="middle" fill="%23f0fdf4" font-family="sans-serif" font-size="15" font-weight="bold">Crystal Clear Potable Water Restored</text></svg>';

const TEST_AFTER_AMBIGUOUS = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23475569"/><polygon points="40,240 360,200 330,120 70,140" fill="%231e293b" opacity="0.7"/><ellipse cx="210" cy="180" rx="50" ry="25" fill="%230284c7" opacity="0.5"/><text x="50%" y="85%" text-anchor="middle" fill="%23fef08a" font-family="sans-serif" font-size="15" font-weight="bold">Doubtful Angle - Shadowed Wet Ground (ambiguous)</text></svg>';

export default function TeamDashboard() {
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamData, setTeamData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'hub' | 'resolved'
  const [isLoading, setIsLoading] = useState(false);

  // Resolution Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationStep, setVerificationStep] = useState(0);

  // Load all teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

  // When selected team changes, fetch details
  useEffect(() => {
    if (selectedTeamId) {
      loadTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId]);

  const loadTeams = async () => {
    try {
      const data = await api.getTeams();
      setTeams(data || []);
      if (data && data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  const loadTeamDetails = async (teamId) => {
    setIsLoading(true);
    try {
      const res = await api.getTeamById(teamId);
      setTeamData(res.team);
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load team details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWork = async (complaintId) => {
    try {
      await api.startTeamWork(selectedTeamId, complaintId);
      await loadTeamDetails(selectedTeamId);
    } catch (err) {
      alert('Error starting work: ' + err.message);
    }
  };

  const openResolutionModal = (complaint) => {
    setResolvingComplaint(complaint);
    setAfterPhoto('');
    setResolutionNotes('');
    setVerificationResult(null);
    setVerificationStep(0);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAfterPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCompleteWork = async () => {
    if (!afterPhoto) {
      alert('Please upload or select an After-repair photo.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep(1);

    // Multi-step scanning animation
    setTimeout(() => setVerificationStep(2), 700);
    setTimeout(() => setVerificationStep(3), 1400);

    try {
      const res = await api.completeTeamWork(selectedTeamId, resolvingComplaint.id, {
        afterPhotoBase64: afterPhoto,
        resolutionNotes
      });

      setTimeout(() => {
        setIsVerifying(false);
        setVerificationResult(res);
        loadTeamDetails(selectedTeamId);
      }, 2000);
    } catch (err) {
      setIsVerifying(false);
      alert('Verification error: ' + err.message);
    }
  };

  const filteredComplaints = (teamData?.complaints || []).filter((c) => {
    if (activeTab === 'active') return ['Assigned', 'In Progress'].includes(c.status);
    if (activeTab === 'hub') return c.status === 'Needs Hub Verification';
    if (activeTab === 'resolved') return ['Resolved', 'Verified'].includes(c.status);
    return true;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Banner & Team Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Maintenance Crew Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <span>Municipal Field Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time automated incident dispatch across Delhi, Ghaziabad, and Noida
          </p>
        </div>

        {/* Team Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <label className="block text-[11px] font-bold text-cyan-300 uppercase mb-1">
              Select Field Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-hidden focus:border-cyan-400 cursor-pointer w-full"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.city}] {t.name} ({t.department})
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Button */}
          <div className="self-end">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
              title="Team Notifications"
            >
              <Bell className="w-5 h-5 text-cyan-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Team Profile Card */}
      {teamData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 font-bold flex items-center justify-center shrink-0">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-base sm:text-lg">{teamData.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  teamData.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {teamData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>{teamData.area}, <strong>{teamData.city}</strong></span>
                <span>•</span>
                <span>Specialty: <strong>{teamData.department}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Contact: {teamData.phone || 'Toll-free 1916'}</span>
            </div>
            <button
              type="button"
              onClick={() => loadTeamDetails(selectedTeamId)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Refresh Team Queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Active Tasks ({teamData?.complaints?.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hub')}
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === 'hub'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Under Hub Review ({teamData?.complaints?.filter(c => c.status === 'Needs Hub Verification').length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('resolved')}
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === 'resolved'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed ({teamData?.complaints?.filter(c => ['Resolved', 'Verified'].includes(c.status)).length || 0})</span>
        </button>
      </div>

      {/* Complaint Cards Queue */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">No tasks in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All tickets in this category have been handled. New reports in {teamData?.city} will be automatically assigned to this crew based on geolocation.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredComplaints.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        #{c.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getUrgencyBadge(c.urgency)}`}>
                        {c.urgency} Priority
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">{c.department} Issue</h3>
                  </div>

                  {/* Distance from base badge */}
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1 shrink-0">
                    <Navigation className="w-3 h-3 text-cyan-600" />
                    ~{c.distanceFromBaseKm || '1.5'} km away
                  </span>
                </div>

                {/* Location & Address */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="font-medium">{c.address || 'Address provided via GPS'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5">
                    GPS Coordinates: {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  </div>
                </div>

                {/* Description & Citizen Photo */}
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img src={c.photoUrl} alt="Reported Issue" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">AI Diagnosis</span>
                    <p className="line-clamp-3 leading-relaxed">{c.description}</p>
                  </div>
                </div>

                {/* Status Specific Alerts */}
                {c.status === 'Needs Hub Verification' && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Pending Central Hub Officer Review</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      {c.aiVerificationNotes || 'AI detected angle or lighting discrepancy in the after photo. Awaiting manual officer approval.'}
                    </p>
                  </div>
                )}

                {c.status === 'Resolved' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Resolved & Verified ({c.aiConfidence || 92}% Confidence)</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 line-clamp-2">
                      {c.resolutionNotes || 'Repairs completed by field maintenance crew.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Actions Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Status: <strong className="text-slate-900">{c.status}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {c.status === 'Assigned' && (
                    <button
                      type="button"
                      onClick={() => handleStartWork(c.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Start Work</span>
                    </button>
                  )}

                  {c.status === 'In Progress' && (
                    <button
                      type="button"
                      onClick={() => openResolutionModal(c)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Work Done (Upload After Photo)</span>
                    </button>
                  )}

                  {c.status === 'Needs Hub Verification' && (
                    <span className="text-[11px] font-bold text-amber-600 px-3 py-1 rounded-lg bg-amber-100">
                      In Review by Hub
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications Drawer Modal */}
      {isNotifOpen && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-black text-slate-900 text-base">Team Notifications</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[75vh]">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No notifications for this team yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                      <p className="font-semibold text-slate-800 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNotifOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Resolution & AI Verification Modal */}
      {resolvingComplaint && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto relative max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Submit Repair & AI Verification</h3>
                  <p className="text-xs text-slate-500">Ticket #{resolvingComplaint.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {!isVerifying && (
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Before vs After Comparison Preview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-rose-600 uppercase flex items-center gap-1">
                  Initial Reported Photo (Before)
                </span>
                <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                  <img src={resolvingComplaint.photoUrl} alt="Before" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                  Field Repair Photo (After)
                </span>
                <div className="aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center text-slate-400">
                  {afterPhoto ? (
                    <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-3">
                      <Camera className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                      <span className="text-[11px]">Upload or select photo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Selection Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                1. Upload Completed Work Photo:
              </label>

              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isVerifying}
                  />
                </label>

                {/* Quick 1-Click Demo Buttons */}
                <button
                  type="button"
                  onClick={() => setAfterPhoto(TEST_AFTER_PIPE)}
                  disabled={isVerifying}
                  className="px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Demo: Fixed Pipe
                </button>
                <button
                  type="button"
                  onClick={() => setAfterPhoto(TEST_AFTER_WATER)}
                  disabled={isVerifying}
                  className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition cursor-pointer"
                >
                  ⚡ Demo: Clear Potable
                </button>
                <button
                  type="button"
                  onClick={() => setAfterPhoto(TEST_AFTER_AMBIGUOUS)}
                  disabled={isVerifying}
                  className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition cursor-pointer"
                >
                  ⚠️ Demo: Ambiguous Angle
                </button>
              </div>
            </div>

            {/* Field Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                2. Field Completion Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe parts replaced, pressure testing, and final restored condition..."
                rows={2}
                disabled={isVerifying}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Real-time AI Verification Progress & Results */}
            {isVerifying && (
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-cyan-700 animate-spin shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-extrabold text-cyan-900">Comparing Before & After Photos with AI Vision...</p>
                  <p className="text-cyan-700">Analyzing surface moisture, pipe clamp integrity, and water clarity.</p>
                </div>
              </div>
            )}

            {verificationResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                verificationResult.status === 'Resolved' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold flex items-center gap-1.5">
                    {verificationResult.status === 'Resolved' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>AI Verified & Ticket Closed!</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Escalated to Municipal Hub for Verification</span>
                      </>
                    )}
                  </span>
                  <span className="font-black px-2.5 py-0.5 rounded-full bg-white text-[11px] shadow-2xs">
                    Confidence: {verificationResult.aiConfidence}%
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {verificationResult.aiVerificationNotes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {verificationResult ? (
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setResolvingComplaint(null)}
                    disabled={isVerifying}
                    className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteWork}
                    disabled={isVerifying || !afterPhoto}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Run AI Verification & Submit</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
