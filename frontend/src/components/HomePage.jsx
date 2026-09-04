import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  Clock,
  Wrench,
  Activity,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '../services/api';

export default function HomePage({ onOpenReport, onOpenTrack, onNavigateTeams, onViewAllSolved }) {
  const [openFaq, setOpenFaq] = useState(0);
  const [statsData, setStatsData] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showcases, setShowcases] = useState([]);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    setIsLoadingStats(true);
    try {
      const res = await api.getPublicStatsAndShowcase();
      if (res.stats) setStatsData(res.stats);
      if (res.showcases) setShowcases(res.showcases);
    } catch (err) {
      console.warn('Stats load error:', err);
      setStatsData({
        totalRegistered: 0,
        totalSolved: 0,
        totalInProgress: 0,
        totalActiveTeams: 0
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const faqs = [
    {
      q: 'How does automated field team assignment work?',
      a: 'When you submit a photo, JalDrishti identifies your GPS coordinates and uses the Haversine routing algorithm to instantly dispatch the nearest specialized municipal team in Delhi, Ghaziabad, or Noida.'
    },
    {
      q: 'How does the AI verify that the issue is truly resolved?',
      a: 'Once repair work is completed, the maintenance crew uploads an After-repair photo. Our Gemini Multimodal AI compares the initial defect photo against the repaired photo, accounting for different angles, lighting, and soil conditions. If confident, it auto-closes the complaint; if doubtful, it flags it for human officer sign-off at the Central Municipal Hub.'
    },
    {
      q: 'Do I need to type a description when reporting an issue?',
      a: 'No. Just upload a photo of the water leak or dirty water. Our AI Vision model inspects the image directly, generates a technical defect description, assigns urgency, and routes the ticket to municipal crews.'
    },
    {
      q: 'How can I check the status of my reported complaint?',
      a: 'Click "Track Complaint" at the top right, enter your Complaint Reference ID (or your name), and you can see live status updates, the dispatched crew details, and the AI problem diagnosis.'
    }
  ];

  return (
    <div className="space-y-10 sm:space-y-16 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-50 via-white to-blue-50/80 border border-slate-200/80 p-5 sm:p-10 lg:p-16 shadow-lg shadow-cyan-900/5">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-blue-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100/90 text-cyan-800 text-[11px] sm:text-xs font-bold border border-cyan-200 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
            <span>AI Water Intelligence & Autonomous Field Dispatch</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Snap a Photo. <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">Nearest Team Dispatched & AI Verified.</span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-normal">
            JalDrishti connects citizens directly with municipal water teams across Delhi, Ghaziabad, and Noida. 
            Capture a photo of a leak or contaminated tap supply. Our server-side AI Vision model 
            diagnoses the defect, dispatches the closest repair crew, and verifies completion through Before/After visual comparison.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onOpenReport}
              className="flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-cyan-600/25 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Droplets className="w-5 h-5 fill-white" />
              <span>Report Water Issue</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={onOpenTrack}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 shadow-sm hover:border-slate-300 transition cursor-pointer"
            >
              <Search className="w-4 h-4 text-cyan-700" />
              <span>Track Complaint</span>
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Nearest Team Geolocation Dispatch</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Multi-Modal Before/After AI Sign-Off</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Central Municipal Hub Escalation</span>
          </div>
        </div>
      </section>

      {/* 2. LIVE MUNICIPAL IMPACT METRICS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-700">
              Live Transparency Metrics
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Municipal Response Tracker
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time public incident record across Delhi, Ghaziabad & Noida</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Registered */}
          <div className="p-5 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2.5 hover:shadow-md transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Problems Registered</span>
              <Activity className="w-5 h-5 text-cyan-600" />
            </div>
            {isLoadingStats || !statsData ? (
              <div className="h-10 sm:h-12 w-28 rounded-2xl bg-slate-200 animate-pulse my-1" />
            ) : (
              <div className="text-3xl sm:text-5xl font-black text-slate-900">{statsData.totalRegistered}</div>
            )}
            <p className="text-xs text-slate-500 font-medium">Citizen water complaints logged into the municipal grid</p>
          </div>

          {/* Solved */}
          <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200 shadow-xs space-y-2.5 hover:shadow-md transition">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-bold uppercase tracking-wider">Problems Solved & Verified</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            {isLoadingStats || !statsData ? (
              <div className="h-10 sm:h-12 w-28 rounded-2xl bg-emerald-200/60 animate-pulse my-1" />
            ) : (
              <div className="text-3xl sm:text-5xl font-black text-emerald-900">{statsData.totalSolved}</div>
            )}
            <p className="text-xs text-emerald-700 font-medium">Verified repairs with Before & After photo confirmation</p>
          </div>

        </div>
      </section>

      {/* 3. BEFORE & AFTER RESOLUTION SHOWCASE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-700">
            Public Proof of Work
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Solved Cases: Before & After Repair Showcase
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Recent municipal repairs verified by AI across Delhi, Ghaziabad & Noida.
          </p>
        </div>

        {showcases.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Loading recent municipal repair showcases...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showcases.slice(0, 4).map((sc) => (
                <div
                  key={sc.id}
                  className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                >
                  {/* Side-by-side photos */}
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
                        <img src={sc.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                        {sc.description}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ AI Verified ({sc.aiConfidence || 95}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      📍 {sc.address || 'Delhi NCR'} • Team: <strong>{sc.assignedTeam?.name || 'Municipal Unit'}</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Solved Cases Option */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onViewAllSolved}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <span>View All Solved Cases</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="space-y-6 sm:space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-700">
            Automated Field Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
            How JalDrishti Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            From citizen photo to nearest team dispatch and AI verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 sm:space-y-4 hover:shadow-md transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-100 text-cyan-800 font-black text-base sm:text-lg flex items-center justify-center shadow-inner">
              1
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Snap Photo & Pin Location</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Capture or upload a photo of the pipeline leak or dirty tap supply. The server-side AI model diagnoses the defect and extracts GPS coordinates.
            </p>
            <div className="pt-1 sm:pt-2 flex items-center gap-2 text-xs font-semibold text-cyan-700">
              <Camera className="w-4 h-4" />
              <span>Camera or Photo Upload</span>
            </div>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 sm:space-y-4 hover:shadow-md transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-100 text-teal-800 font-black text-base sm:text-lg flex items-center justify-center shadow-inner">
              2
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Nearest Team Auto-Dispatched</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Haversine geolocation routing immediately links the complaint to the closest specialized field crew stationed across Delhi, Ghaziabad, or Noida.
            </p>
            <div className="pt-1 sm:pt-2 flex items-center gap-2 text-xs font-semibold text-teal-700">
              <Wrench className="w-4 h-4" />
              <span>Dedicated Team Dashboard & Alerts</span>
            </div>
          </div>

          <div className="p-5 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 sm:space-y-4 hover:shadow-md transition">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-100 text-blue-800 font-black text-base sm:text-lg flex items-center justify-center shadow-inner">
              3
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">AI Before/After Sign-Off</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Field crew uploads an After-repair photo. Multimodal Gemini Vision compares before and after images. If ambiguous, it escalates to the Central Hub for officer sign-off.
            </p>
            <div className="pt-1 sm:pt-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent Public Verification</span>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-4 sm:space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-cyan-700">
            Help & Guidance
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs cursor-pointer transition"
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</h4>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100 font-normal">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM BANNER CTA */}
      <section className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-600 text-white text-center space-y-4 sm:space-y-6 shadow-xl shadow-cyan-600/20">
        <div className="max-w-2xl mx-auto space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            See a Water Leak or Dirty Tap Water?
          </h2>
          <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed font-normal">
            Take a photo right now and let our automated AI system diagnose, dispatch the nearest field team, and verify resolution.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onOpenReport}
            className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-cyan-900 font-black text-xs sm:text-base shadow-lg transition cursor-pointer"
          >
            Submit a Water Photo
          </button>
          <button
            type="button"
            onClick={onOpenTrack}
            className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-cyan-800/80 hover:bg-cyan-800 text-white font-bold text-xs sm:text-base border border-cyan-400/40 transition cursor-pointer"
          >
            Track Existing Complaint
          </button>
        </div>
      </section>

    </div>
  );
}
