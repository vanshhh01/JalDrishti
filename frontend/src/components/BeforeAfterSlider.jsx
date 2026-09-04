import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle, AlertTriangle } from 'lucide-react';

export default function BeforeAfterSlider({ beforeUrl, afterUrl, title, location, resolvedAt, confidence, notes, isHubReviewed }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState('slider'); // 'slider' | 'side'

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-xl transition overflow-hidden flex flex-col">
      {/* Header Info */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            AI Verified Solved ({confidence || 92}%)
          </span>
          <h4 className="mt-1.5 font-bold text-slate-900 text-sm sm:text-base line-clamp-1">{title || 'Municipal Pipeline Repair'}</h4>
          <p className="text-xs text-slate-500 line-clamp-1">{location || 'Delhi NCR'}</p>
        </div>

        {/* View Toggle */}
        <button
          type="button"
          onClick={() => setMode(mode === 'slider' ? 'side' : 'slider')}
          className="text-[11px] font-semibold text-slate-500 hover:text-cyan-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 transition shrink-0"
          title="Toggle Slider / Side-by-Side view"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>{mode === 'slider' ? 'Side View' : 'Slider'}</span>
        </button>
      </div>

      {/* Visual Comparison Area */}
      <div className="relative bg-slate-900 select-none overflow-hidden aspect-video flex items-center justify-center">
        {mode === 'slider' ? (
          <div className="relative w-full h-full">
            {/* After Image (Background) */}
            <img
              src={afterUrl}
              alt="After Repair"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs z-10">
              After (Fixed)
            </span>

            {/* Before Image (Clipped Overlay) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeUrl}
                alt="Before Repair"
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs z-10">
                Before (Leak)
              </span>
            </div>

            {/* Slider Divider Line & Thumb */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white shadow-lg border-2 border-cyan-600 flex items-center justify-center text-cyan-800 text-[10px] font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Range Input for Touch/Mouse */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Before and after comparison slider"
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 w-full h-full gap-0.5">
            <div className="relative h-full">
              <img src={beforeUrl} alt="Before Repair" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-rose-600/90 text-white text-[10px] font-black uppercase">
                Before
              </span>
            </div>
            <div className="relative h-full">
              <img src={afterUrl} alt="After Repair" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-black uppercase">
                After
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Notes & Verification Details */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex-1 flex flex-col justify-between space-y-2.5">
        <p className="text-xs text-slate-600 leading-relaxed italic">
          "{notes || 'AI Vision confirmed: Pipeline sealed and pressure recovered.'}"
        </p>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
          <span>{resolvedAt ? new Date(resolvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently Fixed'}</span>
          {isHubReviewed && (
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Central Hub Verified
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
