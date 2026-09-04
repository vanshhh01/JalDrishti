import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Building, 
  User, 
  CheckCircle,
  RefreshCw,
  Flame,
  FileText,
  Trash2,
  ShieldAlert
} from 'lucide-react';

export default function ComplaintDetailsModal({
  complaint,
  isOpen,
  onClose,
  onDeleteComplaint,
  onHubVerify
}) {
  const [officerNotes, setOfficerNotes] = useState('');
  const [isVerifyingAction, setIsVerifyingAction] = useState(false);

  if (!isOpen || !complaint) return null;

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200"><Flame className="w-3.5 h-3.5 text-red-600" /> CRITICAL</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">HIGH</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MEDIUM</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">LOW</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Clean Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black text-cyan-800 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-xl">
              #JD-{complaint.id ? complaint.id.slice(0, 8).toUpperCase() : ''}
            </span>
            <div className="flex items-center gap-2">
              {getUrgencyBadge(complaint.urgency)}
              {complaint.status === 'Resolved' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ Solved
                </span>
              )}
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

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Photo Section: Side-by-Side if After Photo exists, or Single Photo */}
          {complaint.afterPhotoUrl ? (
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 block">
                Before & After Repair Verification
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Before (Reported Defect)</span>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={complaint.photoUrl} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">After (Completed Repair)</span>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={complaint.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video sm:aspect-square flex items-center justify-center relative shadow-inner">
                <img
                  src={complaint.photoUrl}
                  alt="Complaint evidence"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] text-white font-medium">
                  Reported Photo
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Department:</span>
                    <span className="font-bold text-cyan-800">{complaint.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Urgency:</span>
                    <span className="font-bold text-slate-900">{complaint.urgency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Reported By:</span>
                    <span className="font-bold text-slate-900">{complaint.citizen?.name || 'Citizen'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Date:</span>
                    <span className="font-mono text-slate-700">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {complaint.assignedTeam && (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700">
                    <span className="font-bold block">🚚 {complaint.assignedTeam.name}</span>
                    <span className="text-[10px] text-slate-500">{complaint.assignedTeam.city} • 📞 {complaint.assignedTeam.phone || '1916'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incident Meta (when after photo is present) */}
          {complaint.afterPhotoUrl && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <span className="font-bold text-slate-800">{complaint.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Urgency</span>
                  <span className="font-bold text-slate-800">{complaint.urgency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Crew</span>
                  <span className="font-bold text-cyan-800">{complaint.assignedTeam?.name || 'Municipal Crew'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reported By</span>
                  <span className="font-bold text-slate-800">{complaint.citizen?.name || 'Citizen'}</span>
                </div>
              </div>
              {complaint.aiConfidence && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 flex items-center justify-between">
                  <span>✓ AI Quality Assurance Verification:</span>
                  <span className="font-bold">{complaint.aiConfidence}% Verified Match</span>
                </div>
              )}
            </div>
          )}

          {/* AI Inspection Notes */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 text-xs text-cyan-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-800">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
              <span>AI Visual Inspection Summary</span>
            </div>
            <p className="leading-relaxed font-medium">
              {complaint.aiVerificationNotes || complaint.aiReasoning || 'AI Vision confirmed defect classification.'}
            </p>
          </div>

          {/* Problem Description */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              <span>Problem Description</span>
            </span>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {complaint.description}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
              Location Details
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{complaint.address || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`}</span>
            </div>
          </div>

          {/* Status Note */}
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Current Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-300 text-slate-900">
                {complaint.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Updated automatically when the field team starts work and when AI verifies the repair photo.
            </p>
          </div>

          {/* Human Officer Verification Action Panel */}
          {complaint.status === 'Needs Hub Verification' && onHubVerify && (
            <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-700" />
                  <span className="font-black text-amber-950 text-sm">
                    Human Officer Verification Required
                  </span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                  AI Confidence: {complaint.aiConfidence || 58}%
                </span>
              </div>

              <p className="text-xs text-amber-800 leading-relaxed">
                The AI flagged this repair photo due to ambiguous lighting, shadow, or angle. As the municipal officer, you have the final authority to inspect the visual evidence and either <strong>approve the work to close the ticket</strong> or <strong>send it back to the crew for re-work</strong>.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-amber-900 uppercase">
                  Officer Inspection Remarks (Optional):
                </label>
                <textarea
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="E.g., Inspected clamp alignment and confirmed dry asphalt. Approved."
                  rows={2}
                  disabled={isVerifyingAction}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-200 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isVerifyingAction}
                  onClick={async () => {
                    setIsVerifyingAction(true);
                    try {
                      await onHubVerify(complaint.id, 'Approved', officerNotes);
                      onClose();
                    } catch (err) {
                      alert('Approval failed: ' + err.message);
                    } finally {
                      setIsVerifyingAction(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>✓ Approve Work & Close Complaint</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifyingAction}
                  onClick={async () => {
                    setIsVerifyingAction(true);
                    try {
                      await onHubVerify(complaint.id, 'Rejected', officerNotes || 'Photo unclear or repair incomplete. Please re-check on site and upload clear photo.');
                      onClose();
                    } catch (err) {
                      alert('Re-work order failed: ' + err.message);
                    } finally {
                      setIsVerifyingAction(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>↺ Need Re-Work (Send Back to Crew)</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {onDeleteComplaint ? (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Delete complaint #JD-${complaint.id.slice(0, 8).toUpperCase()} permanently? This action cannot be undone.`)) {
                  await onDeleteComplaint(complaint.id);
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Complaint</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            Close Drawer
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
