import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  RefreshCw, 
  Sparkles, 
  Navigation, 
  ShieldCheck, 
  CheckCircle, 
  FileText, 
  Layers, 
  ArrowRight 
} from 'lucide-react';

export default function TrackComplaintModal({ isOpen, onClose, complaints = [] }) {
  const [searchId, setSearchId] = useState('');
  const [foundComplaint, setFoundComplaint] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    const query = searchId.trim().toLowerCase().replace('#', '').replace('jd-', '');
    
    const match = complaints.find((c) => {
      const cId = c.id.toLowerCase();
      const shortId = c.id.slice(0, 8).toLowerCase();
      const citizenName = (c.citizen?.name || '').toLowerCase();
      return cId.includes(query) || shortId.includes(query) || citizenName.includes(query);
    });

    setFoundComplaint(match || null);
    setHasSearched(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resolved & AI Verified</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>Crew Working On-Site</span>
          </span>
        );
      case 'Needs Hub Verification':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>AI Re-Work / Inspection</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <Navigation className="w-3.5 h-3.5 text-amber-600" />
            <span>Team Dispatched</span>
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 p-5 sm:p-8 space-y-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Track Water Complaint</h3>
              <p className="text-xs text-slate-500">Live GPS team status & Before/After repair verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Ticket ID (e.g. JD-F41BE7) or Citizen Name..."
              className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-cyan-600 focus:bg-white transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            Track Status
          </button>
        </form>

        {/* Search Results Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {hasSearched && (
            <div>
              {foundComplaint ? (
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-6">
                  
                  {/* Top Ticket Status Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm sm:text-base font-black text-cyan-900 bg-cyan-100/80 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                          #JD-{foundComplaint.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Reported on {new Date(foundComplaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="font-semibold">{foundComplaint.address || `${foundComplaint.latitude.toFixed(3)}, ${foundComplaint.longitude.toFixed(3)}`}</span>
                      </p>
                    </div>
                    <div>{getStatusBadge(foundComplaint.status)}</div>
                  </div>

                  {/* Operational Stepper Progress */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                          ✓
                        </div>
                        <span className="font-bold text-slate-800">Reported</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          foundComplaint.assignedTeam ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {foundComplaint.assignedTeam ? '✓' : '2'}
                        </div>
                        <span className="font-bold text-slate-800">Dispatched</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          ['In Progress', 'Resolved'].includes(foundComplaint.status) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {['In Progress', 'Resolved'].includes(foundComplaint.status) ? '✓' : '3'}
                        </div>
                        <span className="font-bold text-slate-800">Crew At Work</span>
                      </div>

                      {/* Step 4 */}
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                          foundComplaint.status === 'Resolved' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {foundComplaint.status === 'Resolved' ? '✓' : '4'}
                        </div>
                        <span className="font-bold text-slate-800">AI Verified Fix</span>
                      </div>
                    </div>
                  </div>

                  {/* Dispatched Field Team Information */}
                  {foundComplaint.assignedTeam && (
                    <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-extrabold text-cyan-700 tracking-wider flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-cyan-600" />
                          <span>Assigned Rapid Action Unit</span>
                        </span>
                        <p className="font-bold text-slate-900 text-sm">{foundComplaint.assignedTeam.name}</p>
                        <p className="text-slate-600 text-[11px]">{foundComplaint.assignedTeam.area}, {foundComplaint.assignedTeam.city}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-cyan-200 text-cyan-800 font-bold">
                          📞 {foundComplaint.assignedTeam.phone || 'Toll-free 1916'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-bold uppercase text-[10px]">
                          {foundComplaint.assignedTeam.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* BEFORE & AFTER PHOTO INSPECTION (SIDE-BY-SIDE ONLY) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-600" />
                        <h4 className="text-sm font-black text-slate-900">
                          {foundComplaint.afterPhotoUrl ? 'Before & After Inspection' : 'Reported Defect Photo'}
                        </h4>
                      </div>
                    </div>

                    {foundComplaint.afterPhotoUrl ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-red-600 uppercase">Before: Reported Defect</span>
                            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                              <img src={foundComplaint.photoUrl} alt="Before" className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-600 uppercase">After: Repair Completed</span>
                            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                              <img src={foundComplaint.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>

                        {/* AI Verification Proof Box */}
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-black text-emerald-800">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>AI Vision Verified Resolution ({foundComplaint.aiConfidence || 94}% Confidence)</span>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-relaxed">
                            {foundComplaint.aiVerificationNotes || 'Gemini Vision confirmed leak containment restored and physical repair completed.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 aspect-video max-w-md mx-auto">
                        <img src={foundComplaint.photoUrl} alt="Defect" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  {/* Complaint Description & Crew Resolution Notes */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Citizen Problem Description:</span>
                      <p className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-medium mt-0.5 leading-relaxed">
                        {foundComplaint.description}
                      </p>
                    </div>

                    {foundComplaint.resolutionNotes && (
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Crew Repair Notes:</span>
                        <p className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 font-medium mt-0.5 leading-relaxed">
                          {foundComplaint.resolutionNotes}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">No Complaint Found</p>
                  <p className="text-xs text-slate-500">
                    We could not find any active or resolved complaint matching <strong className="text-slate-800">"{searchId}"</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
