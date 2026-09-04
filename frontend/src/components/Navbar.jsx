import React, { useState } from 'react';
import { ShieldCheck, Plus, Home, Search, Menu, X, Wrench } from 'lucide-react';
import Logo from './Logo';

export default function Navbar({
  currentView,
  onNavigateHome,
  onNavigateTeams,
  onOpenReport,
  onOpenTrack,
  onOpenDashboard
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileClick = (action) => {
    setMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center text-left cursor-pointer group shrink-0"
        >
          <Logo size="md" />
        </button>

        {/* Desktop Navigation (sm and up) */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-2.5">
          {/* Home / Public Portal */}
          <button
            type="button"
            onClick={onNavigateHome}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentView === 'home'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Public Home</span>
          </button>

          {/* Field Teams Portal Button */}
          <button
            type="button"
            onClick={onNavigateTeams}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              currentView === 'teams'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white border-teal-600 shadow-md'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Field Teams</span>
          </button>

          {/* Municipal Hub Dashboard Button */}
          <button
            type="button"
            onClick={onOpenDashboard}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              currentView === 'staff'
                ? 'bg-cyan-700 text-white border-cyan-700 shadow-md'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            <span>Municipal Hub</span>
          </button>

          {/* Track Complaint Button */}
          <button
            type="button"
            onClick={onOpenTrack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
          >
            <Search className="w-3.5 h-3.5 text-cyan-700" />
            <span>Track</span>
          </button>

          {/* Report Water Issue CTA */}
          <button
            type="button"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-cyan-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Report Issue</span>
          </button>
        </div>

        {/* Mobile Header Actions (< 640px) */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenReport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Report</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white/98 px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => handleMobileClick(onNavigateHome)}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 cursor-pointer text-left"
          >
            <Home className="w-4 h-4 text-slate-600" />
            <span>Public Home</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileClick(onNavigateTeams)}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl bg-teal-50 text-teal-900 text-xs font-bold border border-teal-200 cursor-pointer text-left"
          >
            <Wrench className="w-4 h-4 text-teal-700" />
            <span>Field Teams Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileClick(onOpenDashboard)}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl bg-cyan-50 text-cyan-900 text-xs font-bold border border-cyan-200 cursor-pointer text-left"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-700" />
            <span>Municipal Command Hub</span>
          </button>

          <button
            type="button"
            onClick={() => handleMobileClick(onOpenTrack)}
            className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 cursor-pointer text-left"
          >
            <Search className="w-4 h-4 text-cyan-600" />
            <span>Track Existing Complaint</span>
          </button>
        </div>
      )}
    </header>
  );
}
