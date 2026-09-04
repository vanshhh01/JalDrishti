import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  CheckCircle,
  Truck,
  Layers,
  Filter
} from 'lucide-react';

const DEPARTMENTS = ['All', 'Leak Repair', 'Water Quality', 'Water Supply', 'Sewage-Drainage', 'Billing-Meter'];
const CITIES = ['All', 'Delhi', 'Ghaziabad', 'Noida'];

export default function AllSolvedCases({ onNavigateHome, complaints = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Filter only solved complaints (or complaints that have afterPhotoUrl)
  const solvedComplaints = useMemo(() => {
    return (Array.isArray(complaints) ? complaints : []).filter(c => 
      c.status === 'Resolved' || c.afterPhotoUrl
    );
  }, [complaints]);

  // Apply search and filter
  const filteredSolved = useMemo(() => {
    return solvedComplaints.filter(c => {
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
    }).sort((a, b) => new Date(b.resolvedAt || b.createdAt) - new Date(a.resolvedAt || a.createdAt));
  }, [solvedComplaints, searchQuery, selectedDept, selectedCity]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            All Solved Municipal Cases
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Verified Before & After repair records confirmed by AI across Delhi, Ghaziabad & Noida
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-2xl border border-emerald-200 w-fit">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{filteredSolved.length} Verified Solutions</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search solved cases by problem, address, or team..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:border-cyan-600 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs"
          >
            {CITIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>)}
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs"
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Solved Cases Grid */}
      {filteredSolved.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No Solved Cases Found</p>
          <p className="text-xs text-slate-500">Try clearing your search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSolved.map((sc) => (
            <div
              key={sc.id}
              className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200">
                  #JD-{sc.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>AI Verified ({sc.aiConfidence || 95}%)</span>
                </span>
              </div>

              {/* Side-by-Side Photos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase">Before (Problem)</span>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={sc.photoUrl} alt="Before" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">After (Repaired)</span>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                    {sc.afterPhotoUrl ? (
                      <img src={sc.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No After photo</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div className="space-y-2 pt-1 text-xs">
                <p className="font-semibold text-slate-900 leading-relaxed">
                  {sc.description}
                </p>

                {sc.aiVerificationNotes && (
                  <p className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>AI Notes:</strong> {sc.aiVerificationNotes}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-600" />
                    <span>{sc.address || 'Delhi NCR'}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Truck className="w-3 h-3 text-cyan-600" />
                    <span>{sc.assignedTeam?.name || 'Municipal Rapid Crew'} ({sc.assignedTeam?.city || 'NCR'})</span>
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
