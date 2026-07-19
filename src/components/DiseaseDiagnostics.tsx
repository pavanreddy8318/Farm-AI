/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Camera, Image as ImageIcon, AlertTriangle, CheckCircle, 
  RefreshCw, Sparkles, HelpCircle, Activity, ChevronRight, ShieldAlert,
  Bug, Eye, HeartHandshake, Leaf, Sprout
} from 'lucide-react';
import { DiseaseDiagnosis } from '../types';

export default function DiseaseDiagnostics() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Drag and Drop State
  const [isDragActive, setIsDragActive] = useState(false);

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    setSelectedImage(null);
    setDiagnosis(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setError('Could not access your camera. Please check permissions or upload an image instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg');
        setSelectedImage(base64Image);
        setMimeType('image/jpeg');
        stopCamera();
      }
    }
  };

  // Convert File to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        setDiagnosis(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const runDiagnosis = async (base64Clean: string, mime: string, notes: string) => {
    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Clean,
          mimeType: mime,
          additionalNotes: notes
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server returned an error.');
      }

      const data: DiseaseDiagnosis = await response.json();
      setDiagnosis(data);
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setError(err.message || 'Diagnosis failed. Please ensure your Gemini API key is configured correctly in Secrets.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !mimeType) {
      setError('Please select or capture a plant image first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setDiagnosis(null);

    try {
      // Split off the base64 prefix if it exists
      const base64Clean = selectedImage.includes(',') 
        ? selectedImage.split(',')[1] 
        : selectedImage;

      await runDiagnosis(base64Clean, mimeType, additionalNotes);
    } catch (err: any) {
      setError(err.message || 'Could not analyze leaf image.');
      setIsAnalyzing(false);
    }
  };

  const triggerReset = () => {
    setSelectedImage(null);
    setMimeType(null);
    setDiagnosis(null);
    setAdditionalNotes('');
    setError(null);
  };

  return (
    <div id="diagnostics-module" className="space-y-8">
      {/* Introduction Banner (Editorial style) */}
      <div id="diagnostics-intro" className="bg-editorial-forest text-editorial-cream rounded-none p-8 md:p-10 flex flex-col md:flex-row gap-6 justify-between items-center border border-editorial-border">
        <div id="intro-text" className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-editorial-cream/70" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-editorial-cream/80 font-sans">Crop Health Scanner</span>
          </div>
          <h2 id="intro-title" className="font-serif text-3xl md:text-4xl font-light text-white leading-tight">
            Precision <em>Foliage</em> Pathology Report
          </h2>
          <p id="intro-desc" className="text-editorial-cream/80 text-xs font-serif leading-relaxed">
            Upload an image of a diseased leaf, plant shoot, or soil blemish. 
            Our Gemini-driven pathology engine provides high-precision disease identification, organic botanical remediations, and corrective measures.
          </p>
        </div>
        <div id="intro-icon" className="w-16 h-16 rounded-none bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
          <Leaf className="w-8 h-8 text-white/85" />
        </div>
      </div>

      <div id="main-diagnostics-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Selector & Input */}
        <div id="diagnostics-inputs" className="lg:col-span-5 space-y-6">
          <div id="upload-panel" className="bg-white border border-editorial-border rounded-none p-6 space-y-6">
            <div id="panel-header" className="flex justify-between items-center pb-2 border-b border-editorial-border/60">
              <h3 id="panel-title" className="font-serif font-bold text-editorial-dark text-base flex items-center gap-2">
                <ImageIcon className="w-4.5 h-4.5 text-editorial-sage" /> Leaf Photo Selection
              </h3>
              {selectedImage && (
                <button 
                  onClick={triggerReset} 
                  id="reset-btn"
                  className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage hover:text-editorial-dark hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Clear Selection
                </button>
              )}
            </div>

            {/* Drag Drop & Capture Area */}
            {!selectedImage && !isCameraActive && (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                id="dropzone"
                className={`border border-dashed p-8 text-center transition-all rounded-none ${
                  isDragActive 
                    ? 'border-editorial-dark bg-editorial-sand' 
                    : 'border-editorial-border hover:border-editorial-sage bg-editorial-cream/20'
                }`}
              >
                <Upload className="w-8 h-8 text-editorial-sage mx-auto mb-3" />
                <p id="dropzone-text" className="text-xs font-sans uppercase tracking-widest font-bold text-editorial-dark">
                  Drag & Drop Crop Specimen
                </p>
                <p id="dropzone-subtext" className="text-[10px] text-editorial-sage mt-1 font-sans">
                  PNG, JPG, JPEG, or WEBP (Max 10MB)
                </p>

                <div id="or-divider" className="flex items-center my-4">
                  <div className="flex-1 border-t border-editorial-border"></div>
                  <span className="px-3 text-[9px] text-editorial-sage uppercase font-bold tracking-[0.25em] font-sans">or</span>
                  <div className="flex-1 border-t border-editorial-border"></div>
                </div>

                <div id="action-buttons" className="flex flex-col sm:flex-row gap-3 justify-center">
                  <label id="file-label" className="cursor-pointer px-4 py-2.5 bg-editorial-forest hover:bg-editorial-sage text-white rounded-none text-xs font-sans font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Choose Local File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  <button 
                    onClick={startCamera}
                    id="camera-btn"
                    className="px-4 py-2.5 bg-white border border-editorial-border text-editorial-dark hover:bg-editorial-sand rounded-none text-xs font-sans font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-editorial-sage" /> Use Device Camera
                  </button>
                </div>
              </div>
            )}

            {/* Camera View */}
            {isCameraActive && (
              <div id="camera-stream" className="relative rounded-none overflow-hidden bg-black border border-editorial-border">
                <video 
                  ref={videoRef} 
                  id="video-player"
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                <div id="camera-controls" className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                  <button 
                    onClick={capturePhoto}
                    id="capture-btn"
                    className="px-4 py-2 bg-editorial-forest text-white hover:bg-editorial-sage text-xs font-bold font-sans uppercase tracking-wider rounded-none shadow-lg flex items-center gap-1.5 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" /> Capture Leaf
                  </button>
                  <button 
                    onClick={stopCamera}
                    id="cancel-camera-btn"
                    className="px-4 py-2 bg-editorial-dark text-white hover:bg-zinc-800 text-xs font-semibold rounded-none shadow-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Image Preview & Analyze Button */}
            {selectedImage && (
              <div id="preview-section" className="space-y-4">
                <div id="preview-frame" className="relative rounded-none overflow-hidden border border-editorial-border bg-editorial-sand/40 max-h-72 flex justify-center items-center">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded crop leaf" 
                    id="preview-img"
                    referrerPolicy="no-referrer"
                    className="max-h-72 object-contain"
                  />
                </div>

                <div id="additional-notes-input" className="space-y-2">
                  <label id="notes-label" className="text-[10px] uppercase tracking-wider font-sans font-bold text-editorial-sage flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-editorial-sage" /> Additional Symptoms / Crop Notes (Optional)
                  </label>
                  <textarea 
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    id="notes-textarea"
                    placeholder="E.g., Leaf rust noticed on 20% of tomato crop, watering occurs via sprinkler once a day."
                    className="w-full text-xs p-3 border border-editorial-border rounded-none focus:outline-none focus:border-editorial-dark bg-editorial-cream/20 min-h-20 max-h-32 text-editorial-dark font-sans"
                  />
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  id="analyze-submit-btn"
                  className="w-full py-3.5 bg-editorial-dark hover:bg-editorial-forest text-white font-bold font-sans uppercase tracking-widest text-xs rounded-none shadow-xs transition-all flex items-center justify-center gap-2 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Foliage...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-editorial-cream" /> Diagnose Disease via Gemini
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div id="error-card" className="p-4 bg-rose-50 border border-rose-100 rounded-none text-xs text-rose-800 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error:</span> {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Results / Report */}
        <div id="diagnostics-results" className="lg:col-span-7">
          {/* Default / Loading placeholder */}
          {!diagnosis && !isAnalyzing && (
            <div id="no-report-placeholder" className="bg-white border border-editorial-border rounded-none p-12 text-center flex flex-col items-center justify-center h-full min-h-96 space-y-4">
              <div id="placeholder-icon-container" className="w-16 h-16 rounded-none bg-editorial-sand flex items-center justify-center text-editorial-dark border border-editorial-border">
                <Leaf className="w-8 h-8 text-editorial-sage" />
              </div>
              <h4 id="placeholder-title" className="font-serif font-bold text-editorial-dark text-lg uppercase tracking-wide">
                Foliage Pathology Report
              </h4>
              <p id="placeholder-desc" className="text-xs text-editorial-sage font-serif leading-relaxed max-w-md">
                Diagnoses appear instantly on this panel. Capture or upload a crop leaf image on the left to initiate Gemini leaf pathology analysis.
              </p>
            </div>
          )}

          {/* Loading Indicator */}
          {isAnalyzing && !diagnosis && (
            <div id="analysis-loading" className="bg-white border border-editorial-border rounded-none p-12 text-center flex flex-col items-center justify-center h-full min-h-96 space-y-6">
              <div id="loader-spinner" className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-none border border-editorial-border"></div>
                <div className="absolute inset-0 rounded-none border-t-2 border-editorial-dark animate-spin"></div>
                <Leaf className="w-5 h-5 text-editorial-sage absolute inset-0 m-auto" />
              </div>
              <div id="loader-text-block" className="space-y-2">
                <h4 className="font-serif font-light text-editorial-dark text-xl">
                  Gemini Foliage Scan In Progress
                </h4>
                <p className="text-xs text-editorial-sage max-w-sm mx-auto leading-relaxed font-serif italic">
                  Comparing foliage textures, spotting rust nodes, analyzing chlorophyll levels, and formulating biological remediation steps...
                </p>
              </div>
            </div>
          )}

          {/* Real Report Output */}
          {diagnosis && (
            <div id="diagnosis-report-card" className="bg-white border border-editorial-border rounded-none shadow-xs overflow-hidden divide-y divide-editorial-border">
              
              {/* Header section with Health Status and Confidence */}
              <div id="report-header" className="p-6 md:p-8 bg-editorial-sand/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-editorial-sage font-sans block">Detected Botanical Species</span>
                    <h3 id="report-crop-name" className="font-serif font-bold text-editorial-dark text-2xl flex items-center gap-2">
                      <Sprout className="w-5.5 h-5.5 text-editorial-forest" /> {diagnosis.cropName}
                    </h3>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] uppercase tracking-widest text-editorial-sage font-bold font-sans">Confidence Match</span>
                      <span className="text-sm font-bold font-mono text-editorial-dark">{Math.round(diagnosis.confidenceScore * 100)}%</span>
                    </div>

                    {diagnosis.healthStatus === 'Healthy' ? (
                      <span id="badge-healthy" className="px-3 py-1 border border-editorial-forest text-editorial-forest text-[10px] uppercase tracking-widest font-sans font-bold rounded-none bg-emerald-50/50">
                        Healthy
                      </span>
                    ) : diagnosis.healthStatus === 'Diseased' ? (
                      <span id="badge-diseased" className="px-3 py-1 border border-rose-600 text-rose-800 text-[10px] uppercase tracking-widest font-sans font-bold rounded-none bg-rose-50/50 animate-pulse">
                        Diseased
                      </span>
                    ) : (
                      <span id="badge-unknown" className="px-3 py-1 border border-editorial-border text-editorial-sage text-[10px] uppercase tracking-widest font-sans font-bold rounded-none bg-zinc-50">
                        Unknown
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Condition Headline */}
                {diagnosis.healthStatus === 'Diseased' && diagnosis.diseaseName && (
                  <div id="report-disease-banner" className="mt-6 p-5 bg-rose-50/60 border border-rose-150 rounded-none">
                    <h4 className="text-[10px] font-bold text-rose-800 uppercase tracking-widest font-sans">Primary Pathology Diagnosis</h4>
                    <p className="font-serif font-bold text-rose-950 text-xl mt-1 italic">
                      {diagnosis.diseaseName}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-sans uppercase tracking-widest text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-none font-bold bg-white">
                        Urgency: {diagnosis.urgencyLevel || 'Medium'}
                      </span>
                    </div>
                  </div>
                )}

                {diagnosis.healthStatus === 'Healthy' && (
                  <div id="report-healthy-banner" className="mt-6 p-5 bg-emerald-50/40 border border-editorial-border rounded-none">
                    <h4 className="text-[10px] font-bold text-editorial-forest uppercase tracking-widest font-sans">Botanical Assessment</h4>
                    <p className="font-serif text-editorial-dark text-xs mt-1 leading-relaxed">
                      Your crop foliage appears structurally healthy! No primary pathogens, parasitic infestations, or acute chlorosis nodes were observed in the image scan. Keep up the good irrigation and nutrition regimen.
                    </p>
                  </div>
                )}
              </div>

              {/* Symptoms and Pathology */}
              <div id="report-symptoms" className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Observed Symptoms */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-editorial-dark text-sm flex items-center gap-1.5 uppercase tracking-wide border-b border-editorial-border pb-1.5">
                      <Eye className="w-4 h-4 text-editorial-sage" /> Observed Leaf Signs
                    </h4>
                    <ul className="space-y-2">
                      {diagnosis.symptoms && diagnosis.symptoms.length > 0 ? (
                        diagnosis.symptoms.map((symptom, idx) => (
                          <li key={idx} className="text-xs text-editorial-dark flex items-start gap-2 leading-relaxed font-serif">
                            <span className="w-1.5 h-1.5 bg-editorial-forest mt-1.5 flex-shrink-0" />
                            {symptom}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-editorial-sage italic font-serif">No symptomatic lesions spotted.</li>
                      )}
                    </ul>
                  </div>

                  {/* Pathological Causes */}
                  <div className="space-y-3">
                    <h4 className="font-serif font-bold text-editorial-dark text-sm flex items-center gap-1.5 uppercase tracking-wide border-b border-editorial-border pb-1.5">
                      <Bug className="w-4 h-4 text-editorial-sage" /> Pathological Factors
                    </h4>
                    <ul className="space-y-2">
                      {diagnosis.possibleCauses && diagnosis.possibleCauses.length > 0 ? (
                        diagnosis.possibleCauses.map((cause, idx) => (
                          <li key={idx} className="text-xs text-editorial-dark flex items-start gap-2 leading-relaxed font-serif">
                            <span className="w-1.5 h-1.5 bg-editorial-sage mt-1.5 flex-shrink-0" />
                            {cause}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-editorial-sage italic font-serif">Uniform photosynthesis and transpiration suggested.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Treatment Plans */}
              <div id="report-treatments" className="p-6 md:p-8 space-y-6">
                <h4 className="font-serif font-bold text-editorial-dark text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <HeartHandshake className="w-4.5 h-4.5 text-editorial-sage" /> Recommended Interventions
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Organic Plan */}
                  <div className="p-4 bg-editorial-sand/40 rounded-none border border-editorial-border space-y-3">
                    <h5 className="font-sans font-bold text-editorial-dark text-[10px] uppercase tracking-wider flex items-center gap-1 border-b border-editorial-border/60 pb-1">
                      <Sprout className="w-3.5 h-3.5 text-editorial-forest" /> Biological Alternatives
                    </h5>
                    <ul className="space-y-2">
                      {diagnosis.treatmentPlan?.organic && diagnosis.treatmentPlan.organic.length > 0 ? (
                        diagnosis.treatmentPlan.organic.map((item, idx) => (
                          <li key={idx} className="text-xs text-editorial-dark flex items-start gap-1.5 leading-relaxed font-serif">
                            <span className="text-editorial-forest mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-editorial-sage italic font-serif">No specific botanical adjustments needed.</li>
                      )}
                    </ul>
                  </div>

                  {/* Chemical Plan */}
                  <div className="p-4 bg-editorial-cream/50 rounded-none border border-editorial-border space-y-3">
                    <h5 className="font-sans font-bold text-editorial-dark text-[10px] uppercase tracking-wider flex items-center gap-1 border-b border-editorial-border/60 pb-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-editorial-sage" /> Targeted Synthetics
                    </h5>
                    <ul className="space-y-2">
                      {diagnosis.treatmentPlan?.chemical && diagnosis.treatmentPlan.chemical.length > 0 ? (
                        diagnosis.treatmentPlan.chemical.map((item, idx) => (
                          <li key={idx} className="text-xs text-editorial-dark flex items-start gap-1.5 leading-relaxed font-serif">
                            <span className="text-red-800 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-editorial-sage italic font-serif">No heavy compounds or synthetic pesticides required.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Preventive Measures */}
              <div id="report-prevention" className="p-6 md:p-8 space-y-4">
                <h4 className="font-serif font-bold text-editorial-dark text-sm flex items-center gap-1.5 uppercase tracking-wide border-b border-editorial-border pb-1.5">
                  <CheckCircle className="w-4 h-4 text-editorial-sage" /> Long-Term Management & Guidelines
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnosis.preventiveMeasures && diagnosis.preventiveMeasures.length > 0 ? (
                    diagnosis.preventiveMeasures.map((measure, idx) => (
                      <div key={idx} className="text-xs text-editorial-dark bg-editorial-sand/30 border border-editorial-border p-3.5 rounded-none flex items-start gap-3 leading-relaxed font-serif">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-editorial-sage font-bold">
                          [{String(idx + 1).padStart(2, '0')}]
                        </span>
                        <span>{measure}</span>
                      </div>
                    ))
                  ) : (
                    <li className="text-xs text-editorial-sage italic font-serif col-span-2">Standard soil rotations and clean water sourcing are sufficient.</li>
                  )}
                </ul>
              </div>

              {/* PDF or action block */}
              <div id="report-footer" className="p-4 bg-editorial-sand/40 text-center flex justify-center gap-3">
                <button 
                  onClick={() => window.print()}
                  id="print-btn"
                  className="px-5 py-2.5 bg-editorial-dark hover:bg-editorial-sage border border-editorial-dark text-white text-[10px] uppercase tracking-widest font-sans font-bold rounded-none shadow-xs transition-all flex items-center gap-1.5"
                >
                  Save / Print Diagnostic Report
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for video captures */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
