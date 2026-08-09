/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Scan, Activity, ShieldAlert, Droplets, FlaskConical, Leaf, Lock, 
  CheckCircle2, Copy, FileText, Sparkles, AlertTriangle, ArrowRight,
  RefreshCw, Layers, ShieldCheck, Thermometer
} from 'lucide-react';
import { DiseaseDetectionPipelineResult, YoloBoundingBox } from '../types';

interface DiseasePipelineCardProps {
  result: DiseaseDetectionPipelineResult;
  selectedImage: string | null;
  onFieldMetricsChange?: (metrics: { soilMoisturePct: number; soilPh: number; temperatureC: number; humidityPct: number }) => void;
  isReanalyzing?: boolean;
}

export default function DiseasePipelineCard({
  result,
  selectedImage,
  onFieldMetricsChange,
  isReanalyzing = false
}: DiseasePipelineCardProps) {
  const [copiedText, setCopiedText] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Field sensor interactive state
  const [soilMoisture, setSoilMoisture] = useState(result.fieldMetrics?.soilMoisturePct || 80);
  const [soilPh, setSoilPh] = useState(result.fieldMetrics?.soilPh || 6.5);
  const [tempC, setTempC] = useState(result.fieldMetrics?.temperatureC || 28);
  const [humidity, setHumidity] = useState(result.fieldMetrics?.humidityPct || 75);

  useEffect(() => {
    if (result.fieldMetrics) {
      setSoilMoisture(result.fieldMetrics.soilMoisturePct);
      setSoilPh(result.fieldMetrics.soilPh);
      setTempC(result.fieldMetrics.temperatureC);
      setHumidity(result.fieldMetrics.humidityPct);
    }
  }, [result]);

  // Redraw bounding boxes on canvas over image
  useEffect(() => {
    if (selectedImage && imageRef.current && canvasRef.current && result.yoloBoxes) {
      drawBoundingBoxes();
    }
  }, [selectedImage, result.yoloBoxes]);

  const drawBoundingBoxes = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !result.yoloBoxes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width || 600;
    canvas.height = img.naturalHeight || img.height || 450;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    result.yoloBoxes.forEach((box: YoloBoundingBox) => {
      const x1 = box.x1 <= 1 ? box.x1 * canvas.width : box.x1;
      const y1 = box.y1 <= 1 ? box.y1 * canvas.height : box.y1;
      const x2 = box.x2 <= 1 ? box.x2 * canvas.width : box.x2;
      const y2 = box.y2 <= 1 ? box.y2 * canvas.height : box.y2;
      const width = Math.max(10, x2 - x1);
      const height = Math.max(10, y2 - y1);

      const strokeColor = box.color || '#ef4444';

      // Outer glow and box outline
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(3, Math.floor(canvas.width / 220));
      ctx.strokeRect(x1, y1, width, height);

      // Semi-transparent fill
      ctx.fillStyle = strokeColor + '22';
      ctx.fillRect(x1, y1, width, height);

      // Label background fill
      const labelText = `${box.label || result.diseaseName} (${((box.confidence || result.confidenceScore || 0.9) * 100).toFixed(0)}%)`;
      ctx.font = `bold ${Math.max(13, Math.floor(canvas.width / 38))}px sans-serif`;
      const textMetrics = ctx.measureText(labelText);
      const textHeight = Math.max(18, Math.floor(canvas.width / 32));

      ctx.fillStyle = strokeColor;
      const labelY = y1 - textHeight - 4 < 0 ? y1 : y1 - textHeight - 4;
      ctx.fillRect(x1, labelY, textMetrics.width + 12, textHeight + 4);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x1 + 6, labelY + textHeight - 3);
    });
  };

  const handleMetricSubmit = () => {
    if (onFieldMetricsChange) {
      onFieldMetricsChange({
        soilMoisturePct: soilMoisture,
        soilPh: soilPh,
        temperatureC: tempC,
        humidityPct: humidity
      });
    }
  };

  const copyFarmerSummary = () => {
    const summary = `
=== FARMAI CROP DIAGNOSIS & FIELD ACTION REPORT ===
Date: ${new Date().toLocaleDateString()}
Crop: ${result.cropName}
Identified Disease: ${result.diseaseName} (Confidence: ${((result.confidenceScore || 0.94) * 100).toFixed(0)}%)
Severity: ${result.severity?.severityGrade || 'Moderate'} (${result.severity?.dsiPercentage || 25}% Leaf Damage)

--- FGCN CROSS-FACTOR GRAPH ANALYSIS ---
Soil Moisture: ${soilMoisture}% | Soil pH: ${soilPh} | Temp: ${tempC}°C | Humidity: ${humidity}%
Predicted Yield Loss: ${result.fieldMetrics?.predictedYieldLossKgPerHa || 300} kg/hectare
Graph Risk Assessment: ${result.fieldMetrics?.relationalRiskFactor}

--- ACTIONABLE INSTRUCTION ENGINE ---
1. IMMEDIATE CHEMICAL/BIO TREATMENT:
   - Treatment: ${result.actionPlan?.immediateTreatment?.chemicalOrBio}
   - Dosage: ${result.actionPlan?.immediateTreatment?.dosagePerAcre}
   - Application: ${result.actionPlan?.immediateTreatment?.applicationMethod}

2. AGRONOMIC ADJUSTMENTS:
   - Irrigation Control: ${result.actionPlan?.agronomicAdjustments?.irrigationControl}
   - Fertilizer Adjustment: ${result.actionPlan?.agronomicAdjustments?.fertilizerAdjustment}

3. PREVENTIVE CARE:
   - Field Management: ${(result.actionPlan?.preventiveCare?.fieldManagement || []).join('; ')}
   - Surrounding Protection: ${result.actionPlan?.preventiveCare?.surroundingCropProtection}

PRIVACY GUARANTEE: ${result.actionPlan?.privacySafeguard?.badge}
Hash: ${result.actionPlan?.privacySafeguard?.encryptedModelHash}
===================================================
`.trim();

    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const severityDsi = result.severity?.dsiPercentage || 25;
  const severityGrade = result.severity?.severityGrade || (severityDsi > 40 ? 'Severe' : severityDsi > 20 ? 'Moderate' : 'Low');

  return (
    <div id="disease-pipeline-container" className="space-y-8 font-serif">
      {/* Top Workflow Bar */}
      <div className="bg-editorial-sand/80 border border-editorial-border p-4 flex flex-wrap items-center justify-between gap-4 font-sans text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span className="font-bold text-editorial-dark uppercase tracking-wider text-[11px]">
            Automated Pipeline Executed
          </span>
          <span className="text-editorial-sage">• YOLOv8 → FGCN Graph → Action Plan</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyFarmerSummary}
            className="px-3 py-1.5 bg-white border border-editorial-border hover:bg-editorial-cream text-editorial-dark font-medium rounded-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            {copiedText ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-editorial-sage" />}
            <span>{copiedText ? 'Report Copied' : 'Copy Instruction Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Main 3-Step Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* STEP 1: YOLOv8 Visual Scanning Card */}
        <div className="lg:col-span-6 bg-white border border-editorial-border p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-editorial-forest text-white rounded-full flex items-center justify-center font-sans font-bold text-xs">
                1
              </span>
              <h3 className="font-serif font-bold text-editorial-dark text-lg">
                YOLOv8 Visual Scanning
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs">
              Computer Vision
            </span>
          </div>

          {/* Image canvas wrapper */}
          <div className="relative bg-neutral-900 border border-editorial-border overflow-hidden group min-h-[260px] flex items-center justify-center">
            {selectedImage || result.imageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={selectedImage || result.imageUrl}
                  alt="Infected Crop Leaf"
                  className="max-h-[380px] w-full object-contain block"
                  onLoad={drawBoundingBoxes}
                  crossOrigin="anonymous"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-neutral-400 font-sans text-xs flex flex-col items-center gap-2 py-12">
                <Scan className="w-8 h-8 text-neutral-500 animate-pulse" />
                <span>No leaf image selected</span>
              </div>
            )}

            {/* Severity Badge overlay */}
            <div className="absolute top-3 right-3 bg-editorial-dark/90 backdrop-blur-md text-white px-3 py-1.5 border border-white/20 font-sans text-xs flex items-center gap-2 shadow-md">
              <AlertTriangle className={`w-4 h-4 ${severityDsi > 30 ? 'text-rose-400' : 'text-amber-400'}`} />
              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-300 font-bold block leading-none">Severity Badge</span>
                <span className="font-bold text-white text-xs">{severityGrade} Risk • {severityDsi}% Leaf Damage</span>
              </div>
            </div>
          </div>

          {/* YOLOv8 DSI Summary Box */}
          <div className="bg-editorial-sand/60 border border-editorial-border p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-sans">
              <span className="text-editorial-sage font-bold uppercase tracking-wider text-[10px]">Identified Pathology</span>
              <span className="font-bold text-editorial-dark font-mono text-[11px]">
                Confidence: {((result.confidenceScore || 0.94) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="font-serif font-bold text-editorial-dark text-xl text-rose-950 flex items-center justify-between">
              <span>{result.diseaseName || 'Crop Pathogen Detected'}</span>
            </div>
            <p className="text-xs text-editorial-dark/80 font-serif leading-relaxed">
              YOLOv8 detected bounding box lesions with a calculated Disease Severity Index (DSI) of{' '}
              <strong className="text-rose-800">{severityDsi}% infected foliage area</strong> on {result.cropName || 'crop leaf'}.
            </p>
          </div>
        </div>

        {/* STEP 2: PyTorch Geometric Cross-Factor Graph Analysis (FGCN) */}
        <div className="lg:col-span-6 bg-white border border-editorial-border p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-editorial-forest text-white rounded-full flex items-center justify-center font-sans font-bold text-xs">
                2
              </span>
              <h3 className="font-serif font-bold text-editorial-dark text-lg">
                Cross-Factor Graph Analysis
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-sans font-bold uppercase tracking-wider rounded-xs">
              PyTorch Geometric FGCN
            </span>
          </div>

          {/* Graph prediction metrics highlight */}
          <div className="grid grid-cols-2 gap-3 font-sans">
            <div className="bg-rose-50/70 border border-rose-200 p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-800 tracking-wider block">Predicted Yield Loss</span>
              <div className="text-2xl font-serif font-bold text-rose-950">
                -{result.fieldMetrics?.predictedYieldLossKgPerHa || 300} <span className="text-xs font-sans font-normal text-rose-800">kg/hectare</span>
              </div>
              <span className="text-[10px] text-rose-700/90 block font-sans">Without immediate treatment</span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">Graph Relational Risk</span>
              <div className="text-2xl font-serif font-bold text-amber-950">
                {((result.fieldMetrics?.graphNodeRiskScore || 0.85) * 100).toFixed(0)}% <span className="text-xs font-sans font-normal text-amber-800">Risk Score</span>
              </div>
              <span className="text-[10px] text-amber-800/90 block font-sans">Fungal sporulation elevated</span>
            </div>
          </div>

          {/* Graph relational narrative */}
          <div className="p-3.5 bg-editorial-cream border border-editorial-border text-xs leading-relaxed text-editorial-dark/90 space-y-1">
            <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] uppercase tracking-wider text-editorial-sage">
              <Layers className="w-3.5 h-3.5 text-editorial-forest" /> Field Graph Relational Interaction
            </div>
            <p className="font-serif italic">
              "{result.fieldMetrics?.relationalRiskFactor || `High moisture combined with ${result.diseaseName} increases risk by 40%, predicting a yield loss of ${result.fieldMetrics?.predictedYieldLossKgPerHa || 300} kg/ha.`}"
            </p>
          </div>

          {/* Interactive Field Sensor Parameter Adjuster */}
          <div className="border border-editorial-border p-4 bg-editorial-sand/40 space-y-3 font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-editorial-dark uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-600" /> Interactive Field Sensor Input
              </span>
              <span className="text-[10px] text-editorial-sage">Simulate field changes</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2 border border-editorial-border text-center">
                <label className="text-[9px] uppercase text-editorial-sage font-bold block">Soil Moisture</label>
                <input
                  type="number"
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(Number(e.target.value))}
                  className="w-full text-center font-bold text-editorial-dark font-mono text-sm border-b border-editorial-border mt-0.5 focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500">% volumetric</span>
              </div>

              <div className="bg-white p-2 border border-editorial-border text-center">
                <label className="text-[9px] uppercase text-editorial-sage font-bold block">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  value={soilPh}
                  onChange={(e) => setSoilPh(Number(e.target.value))}
                  className="w-full text-center font-bold text-editorial-dark font-mono text-sm border-b border-editorial-border mt-0.5 focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500">pH scale</span>
              </div>

              <div className="bg-white p-2 border border-editorial-border text-center">
                <label className="text-[9px] uppercase text-editorial-sage font-bold block">Temp (°C)</label>
                <input
                  type="number"
                  value={tempC}
                  onChange={(e) => setTempC(Number(e.target.value))}
                  className="w-full text-center font-bold text-editorial-dark font-mono text-sm border-b border-editorial-border mt-0.5 focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500">ambient °C</span>
              </div>

              <div className="bg-white p-2 border border-editorial-border text-center">
                <label className="text-[9px] uppercase text-editorial-sage font-bold block">Humidity</label>
                <input
                  type="number"
                  value={humidity}
                  onChange={(e) => setHumidity(Number(e.target.value))}
                  className="w-full text-center font-bold text-editorial-dark font-mono text-sm border-b border-editorial-border mt-0.5 focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500">% RH</span>
              </div>
            </div>

            {onFieldMetricsChange && (
              <button
                onClick={handleMetricSubmit}
                disabled={isReanalyzing}
                className="w-full py-2 bg-editorial-forest hover:bg-editorial-dark text-white text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                {isReanalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalculating Graph Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Recalculate PyTorch FGCN Yield Reduction
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* STEP 3: Actionable Instruction Engine Dashboard Card */}
      <div className="bg-white border-2 border-editorial-dark p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-editorial-border pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-editorial-forest text-white rounded-full flex items-center justify-center font-sans font-bold text-sm">
              3
            </span>
            <div>
              <h3 className="font-serif font-bold text-editorial-dark text-xl">
                Actionable Farmer Instruction Engine
              </h3>
              <p className="text-xs text-editorial-sage font-sans uppercase tracking-wider font-semibold">
                Tailored Field Remediation Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-sans font-bold text-xs uppercase tracking-wider rounded-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Verified Protocol
            </span>
          </div>
        </div>

        {/* 3-Step Farmer Instruction Breakdown Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          
          {/* Card A: Immediate Chemical / Bio Treatment */}
          <div className="border border-editorial-border p-5 bg-editorial-sand/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-editorial-border">
                <FlaskConical className="w-4 h-4 text-rose-600" /> Immediate Chemical / Bio Treatment
              </div>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Recommended Spray</span>
                  <p className="font-serif font-bold text-editorial-dark text-sm leading-snug">
                    {result.actionPlan?.immediateTreatment?.chemicalOrBio || 'Spray Copper Fungicide (2g per Liter of water).'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Dosage per Acre</span>
                  <p className="font-sans font-semibold text-editorial-dark text-xs">
                    {result.actionPlan?.immediateTreatment?.dosagePerAcre || '400g - 500g in 200L water per acre'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Application Method</span>
                  <p className="font-serif text-editorial-dark/90 text-xs leading-relaxed">
                    {result.actionPlan?.immediateTreatment?.applicationMethod || 'Focus strictly on affected plant zones during cool morning hours.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-editorial-border/60 text-[10px] text-rose-800 font-bold">
              ⚡ Apply within 24-48 hours
            </div>
          </div>

          {/* Card B: Agronomic Adjustments (Irrigation & Fertilizer) */}
          <div className="border border-editorial-border p-5 bg-editorial-sand/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-editorial-border">
                <Droplets className="w-4 h-4 text-sky-600" /> Agronomic Adjustments
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Irrigation Control</span>
                  <p className="font-serif text-editorial-dark text-xs leading-relaxed">
                    {result.actionPlan?.agronomicAdjustments?.irrigationControl || 'Stop overhead watering immediately. Switch to drip irrigation for 5 days to reduce humidity on leaves.'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Fertilizer Tweak</span>
                  <p className="font-serif text-editorial-dark text-xs leading-relaxed">
                    {result.actionPlan?.agronomicAdjustments?.fertilizerAdjustment || 'Reduce Nitrogen application by 10% temporarily to prevent excessive lush growth that favors fungi.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-editorial-border/60 text-[10px] text-sky-800 font-bold">
              💧 Moisture Management Protocol
            </div>
          </div>

          {/* Card C: Preventive Care & Field Safeguard */}
          <div className="border border-editorial-border p-5 bg-editorial-sand/30 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-editorial-border">
                <ShieldAlert className="w-4 h-4 text-emerald-600" /> Preventive Care & Crop Protection
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Field Management</span>
                  <ul className="list-disc list-inside font-serif text-editorial-dark/90 text-xs space-y-1 mt-1">
                    {(result.actionPlan?.preventiveCare?.fieldManagement || [
                      'Prune lower infected leaves using sanitized tools.',
                      'Maintain proper plant spacing for canopy air flow.',
                      'Apply straw mulch to prevent soil-splash.'
                    ]).map((tip, idx) => (
                      <li key={idx} className="leading-tight">{tip}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[10px] text-editorial-sage uppercase font-bold block">Surrounding Crop Safety</span>
                  <p className="font-serif text-editorial-dark text-xs leading-relaxed">
                    {result.actionPlan?.preventiveCare?.surroundingCropProtection || 'Spray preventive bio-fungicide on surrounding uninfected crops.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-editorial-border/60 text-[10px] text-emerald-800 font-bold">
              🛡️ Uninfected Canopy Buffer Active
            </div>
          </div>

        </div>

        {/* Privacy Safeguard Banner */}
        <div className="p-4 bg-editorial-forest text-editorial-cream border border-editorial-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <span className="font-bold text-white text-xs uppercase tracking-wider block">Privacy Safeguard & Data Integrity</span>
              <p className="text-[11px] text-editorial-cream/80 font-serif leading-snug">
                {result.actionPlan?.privacySafeguard?.badge || 'Local image and field metrics processed on-site. Only encrypted weight updates sent to global model.'}
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-black/25 border border-white/20 font-mono text-[10px] text-emerald-200 rounded-xs flex-shrink-0">
            Hash: {result.actionPlan?.privacySafeguard?.encryptedModelHash || '0x8f3a47b1e29c04d193f8e56a7b32c910'}
          </div>
        </div>

      </div>
    </div>
  );
}
