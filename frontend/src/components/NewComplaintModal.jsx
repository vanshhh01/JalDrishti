import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Camera, 
  MapPin, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Navigation, 
  Search, 
  Droplets,
  User,
  Copy,
  Check,
  Flame,
  FileText,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Edit3
} from 'lucide-react';
import LocationPickerModal from './LocationPickerModal';
import { api } from '../services/api';

export default function NewComplaintModal({ isOpen, onClose, onSubmitComplaint }) {
  // Step State: 1 = Form Input, 2 = AI Review & Confirmation, 3 = Success ID Receipt
  const [step, setStep] = useState(1);

  // Form Inputs
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // AI Generated Insights (for Review in Step 2)
  const [aiDescription, setAiDescription] = useState('');
  const [aiUrgency, setAiUrgency] = useState('Medium');
  const [aiDepartment, setAiDepartment] = useState('Leak Repair');
  const [aiReasoning, setAiReasoning] = useState('');

  // Location Picker & Geolocation States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Submission States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isPhotoRejected, setIsPhotoRejected] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
        setIsPhotoRejected(false);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Reverse Geocoding helper
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',').map((p) => p.trim());
          const cleanAddr = parts.slice(0, 4).join(', ');
          return cleanAddr;
        }
      }
    } catch (e) {
      console.warn('Reverse geocode notice:', e);
    }
    return `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
  };

  // Option 1: Auto-Detect GPS
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLatitude(userLat);
        setLongitude(userLng);
        setAddress(`Detecting address for ${userLat.toFixed(4)}°N, ${userLng.toFixed(4)}°E...`);
        
        const realAddress = await reverseGeocode(userLat, userLng);
        setAddress(realAddress);
        setIsLocating(false);
      },
      async (err) => {
        console.warn('High-accuracy GPS error, attempting standard accuracy:', err);
        // Fallback attempt with standard accuracy
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;
            setLatitude(userLat);
            setLongitude(userLng);
            const realAddress = await reverseGeocode(userLat, userLng);
            setAddress(realAddress);
            setIsLocating(false);
          },
          (fallbackErr) => {
            console.warn('Standard GPS failed:', fallbackErr);
            setIsLocating(false);
            setErrorMsg('GPS location access was denied or timed out. Please click "Drop Pin / Search on Map" to select your location.');
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Option 2: Select on Map
  const handleLocationPicked = (loc) => {
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setAddress(loc.address);
  };

  // STEP 1 -> STEP 2: Scan Photo with AI and show description to user
  const handleAnalyzePhoto = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!photo) {
      setErrorMsg('Please capture or upload a water photo.');
      return;
    }
    if (!address.trim() || latitude === null || longitude === null) {
      setErrorMsg('Please auto-detect GPS or select the incident location on the map.');
      return;
    }

    setErrorMsg(null);
    setIsPhotoRejected(false);
    setIsAnalyzing(true);

    try {
      const res = await api.analyzePhoto(photo);
      const insights = res.aiInsights;

      setAiDescription(insights.description || 'Reported water infrastructure issue.');
      setAiUrgency(insights.urgency || 'Medium');
      setAiDepartment(insights.department || 'Leak Repair');
      setAiReasoning(insights.aiReasoning || 'AI Vision evaluated image pixels to classify defect.');

      setIsAnalyzing(false);
      setStep(2); // Go to AI Review Screen!
    } catch (err) {
      console.error('AI Photo scan error:', err);
      const msg = err.message || 'The uploaded photo was rejected. Please upload a clear photo of the water problem.';
      setErrorMsg(msg);
      setIsPhotoRejected(true);
      setPhoto(null);
      setIsAnalyzing(false);
    }
  };

  // STEP 2 -> STEP 3: Confirm and save to DB
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await onSubmitComplaint({
        name: name.trim(),
        photoBase64: photo,
        description: aiDescription,
        urgency: aiUrgency,
        department: aiDepartment,
        aiReasoning,
        latitude,
        longitude,
        address
      });

      setResultData(response);
      setIsSubmitting(false);
      setStep(3); // Success Screen with Complaint ID
    } catch (err) {
      console.error('Complaint submit error:', err);
      setErrorMsg(err.message || 'Failed to submit complaint.');
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (resultData?.complaintRefId) {
      navigator.clipboard.writeText(resultData.complaintRefId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setPhoto(null);
    setName('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setAiDescription('');
    setResultData(null);
    setIsAnalyzing(false);
    setIsSubmitting(false);
    setErrorMsg(null);
    setIsPhotoRejected(false);
    onClose();
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200"><Flame className="w-3.5 h-3.5 text-red-600" /> CRITICAL PRIORITY</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">HIGH PRIORITY</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">MEDIUM PRIORITY</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">LOW PRIORITY</span>;
    }
  };

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {step === 1 && '1. Upload Water Issue Photo'}
                  {step === 2 && '2. Review AI Problem Diagnosis'}
                  {step === 3 && '3. Complaint Registered'}
                </h3>
                <p className="text-xs text-slate-500">
                  {step === 1 && 'AI Vision will inspect your photo and write the issue description'}
                  {step === 2 && 'Check the AI-generated problem description before final submission'}
                  {step === 3 && 'Complaint successfully dispatched to municipal repair teams'}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            
            {/* Non-water photo rejection alert */}
            {isPhotoRejected && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Image Rejected by AI Verification</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {errorMsg || 'The uploaded photo does not appear to show a water issue, pipe leak, or water quality problem.'}
                </p>
                <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Please choose a valid water leak or tap water photo below.</span>
                </div>
              </div>
            )}

            {errorMsg && !isPhotoRejected && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* AI ANALYZING SPINNER */}
            {isAnalyzing && (
              <div className="py-14 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-cyan-100 border-t-cyan-600 animate-spin flex items-center justify-center" />
                  <Droplets className="w-8 h-8 text-cyan-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">AI Vision is Analyzing Your Photo...</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Verifying water relevance and generating technical problem diagnosis for municipal staff.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1: PHOTO & LOCATION INPUT */}
            {!isAnalyzing && step === 1 && (
              <form onSubmit={handleAnalyzePhoto} className="space-y-4">
                
                {/* 1. Only Ask Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    1. Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 2. Photo Upload Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    2. Upload Photo of Water Problem (AI will analyze this)
                  </label>

                  {photo ? (
                    <div className="relative rounded-2xl overflow-hidden border border-cyan-300 bg-slate-100 aspect-video flex items-center justify-center">
                      <img src={photo} alt="Reported water sample" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white border border-slate-200 shadow-sm cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="border-2 border-dashed border-slate-200 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-cyan-50/40 transition group">
                        <Camera className="w-10 h-10 text-slate-400 group-hover:text-cyan-600 transition mb-2" />
                        <span className="text-xs font-bold text-slate-800">Click to capture or upload water photo</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">Pipeline leaks, dirty water, burst mains, or drain issues</span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* 3. Location Options */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3. Location of Incident
                    </label>
                    {latitude !== null && longitude !== null ? (
                      <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                        📍 {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        📍 Location Required
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <button
                      type="button"
                      onClick={handleAutoDetectGPS}
                      disabled={isLocating}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition cursor-pointer"
                    >
                      <Navigation className={`w-4 h-4 text-cyan-600 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Detecting Address via GPS...' : '1. Auto-Detect GPS & Address'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-700 hover:text-cyan-800 text-xs font-semibold transition cursor-pointer"
                    >
                      <Search className="w-4 h-4 text-cyan-600" />
                      <span>2. Drop Pin / Search on Map</span>
                    </button>
                  </div>

                  <div className="relative">
                    <MapPin className="w-4 h-4 text-cyan-600 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, colony, or landmark..."
                      className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-cyan-100 hover:bg-cyan-200 text-cyan-800 font-bold text-[11px] transition cursor-pointer"
                    >
                      Pick on Map
                    </button>
                  </div>
                </div>

                {/* Submit to AI */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Scan Photo with AI & Generate Description</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

              </form>
            )}

            {/* STEP 2: AI REVIEW & CONFIRMATION (SHOWN TO USER BEFORE SUBMISSION) */}
            {step === 2 && (
              <div className="space-y-5">
                
                {/* AI Review Banner */}
                <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-950 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-cyan-900">AI Problem Diagnosis Ready for Review</h4>
                    <p className="text-cyan-800 text-[11px] mt-0.5 leading-relaxed">
                      Our AI model analyzed your photo and generated the following technical summary for the municipal team. You can review or edit it below before final submission.
                    </p>
                  </div>
                </div>

                {/* Photo Preview + Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {photo && (
                    <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video sm:aspect-square flex items-center justify-center relative shadow-inner">
                      <img src={photo} alt="Analyzed water photo" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white font-medium">
                        Your Photo
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        AI Municipal Dispatch Routing
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {getUrgencyBadge(aiUrgency)}
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                          Dept: {aiDepartment}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                      <p className="font-semibold text-slate-800">Reporter: {name}</p>
                      <p className="text-[11px] text-slate-500 truncate">📍 {address}</p>
                    </div>
                  </div>
                </div>

                {/* Editable AI-Generated Problem Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-600" />
                      <span>AI-Generated Description (You can edit if needed):</span>
                    </label>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Edit3 className="w-3 h-3" /> Editable
                    </span>
                  </div>

                  <textarea
                    rows={4}
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-white border border-cyan-300 text-slate-900 text-xs sm:text-sm leading-relaxed focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20 transition resize-none shadow-inner"
                  />
                </div>

                {/* AI Reasoning Pill */}
                {aiReasoning && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    💡 <strong className="text-slate-700">AI Assessment:</strong> {aiReasoning}
                  </p>
                )}

                {/* Action Buttons: Retake vs Confirm */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-1/3 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Change Photo</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleFinalSubmit}
                    className="w-full sm:w-2/3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Registering Complaint...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Submit Complaint</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

            {/* STEP 3: COMPLAINT ID RECEIPT SCREEN */}
            {step === 3 && resultData && (
              <div className="space-y-6">
                
                {/* Complaint ID Receipt */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900">Complaint Registered Successfully!</h4>
                  <p className="text-xs text-slate-600">Your unique Complaint Reference ID:</p>

                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-cyan-300 shadow-sm mt-2">
                    <span className="font-mono text-xl font-black text-cyan-800 tracking-wider">
                      {resultData.complaintRefId || `#JD-${resultData.complaint?.id?.slice(0,8).toUpperCase()}`}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title="Copy Complaint ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmed Details */}
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Registered Complaint Summary:</span>
                    {getUrgencyBadge(resultData.complaint?.urgency || aiUrgency)}
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                    {resultData.complaint?.description || aiDescription}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>🏢 Routed to: <strong className="text-slate-800">{resultData.complaint?.department || aiDepartment}</strong></span>
                    <span>📍 {address}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleResetAndClose}
                    className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    Done & Return to Homepage
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>,
      document.body
    )}

      {/* Interactive Map Picker Modal */}
      <LocationPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        initialLat={latitude || 28.6350}
        initialLng={longitude || 77.2650}
        initialAddress={address}
        onSelectLocation={handleLocationPicked}
      />
    </>
  );
}
