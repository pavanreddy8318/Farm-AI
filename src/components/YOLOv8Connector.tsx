/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, Cpu, RefreshCw, Eye, Zap, Upload, Image as ImageIcon, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { YoloConfig, YoloDetectionResult, YoloBoundingBox, DiseaseDetectionPipelineResult } from '../types';
import DiseasePipelineCard from './DiseasePipelineCard';

export default function YOLOv8Connector() {
  const [config, setConfig] = useState<YoloConfig>(() => {
    const saved = localStorage.getItem('farmai_yolo_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      endpointUrl: 'http://localhost:8000/predict',
      apiKey: '',
      confidenceThreshold: 0.25,
      iouThreshold: 0.45,
      modelName: 'yolov8n-farm-pathology.pt',
      useFallback: true
    };
  });

  const [testStatus, setTestStatus] = useState<{
    state: 'idle' | 'testing' | 'success' | 'offline';
    message?: string;
  }>({ state: 'idle' });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<YoloDetectionResult | null>(null);
  const [pipelineResult, setPipelineResult] = useState<DiseaseDetectionPipelineResult | null>(null);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('farmai_yolo_config', JSON.stringify(config));
  }, [config]);

  // Redraw canvas boxes when detectionResult or selectedImage changes
  useEffect(() => {
    if (selectedImage && imageRef.current && canvasRef.current && detectionResult?.boxes) {
      drawBoundingBoxes();
    }
  }, [selectedImage, detectionResult]);

  const testServerConnection = async () => {
    setTestStatus({ state: 'testing' });
    try {
      const response = await fetch('/api/yolo/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl: config.endpointUrl })
      });
      const data = await response.json();
      if (data.status === 'connected') {
        setTestStatus({ state: 'success', message: data.message });
      } else {
        setTestStatus({ state: 'offline', message: data.message });
      }
    } catch (err: any) {
      setTestStatus({
        state: 'offline',
        message: 'Could not reach server. Built-in YOLOv8 Vision AI emulator active.'
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setSelectedImage(ev.target.result as string);
          setDetectionResult(null);
          setPipelineResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const runPipelineDetection = async (overrideMetrics?: { soilMoisturePct: number; soilPh: number; temperatureC: number; humidityPct: number }) => {
    if (!selectedImage) return;
    setIsDetecting(true);
    try {
      // 1. Fetch YOLO prediction result
      const yoloRes = await fetch('/api/yolo/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          endpointUrl: config.endpointUrl,
          confidenceThreshold: config.confidenceThreshold,
          apiKey: config.apiKey
        })
      });

      if (yoloRes.ok) {
        const yoloData: YoloDetectionResult = await yoloRes.json();
        setDetectionResult(yoloData);
      }

      // 2. Fetch full Disease Detection & Action Pipeline (YOLOv8 + PyTorch Geometric FGCN + Action Engine)
      const pipelineRes = await fetch('/api/disease-detection/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          fieldParams: overrideMetrics || {
            soilMoisturePct: 80,
            soilPh: 6.5,
            temperatureC: 28,
            humidityPct: 75
          }
        })
      });

      if (pipelineRes.ok) {
        const pipelineData: DiseaseDetectionPipelineResult = await pipelineRes.json();
        setPipelineResult(pipelineData);
      }
    } catch (err: any) {
      console.error('Pipeline detection error:', err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFieldMetricsChange = async (metrics: { soilMoisturePct: number; soilPh: number; temperatureC: number; humidityPct: number }) => {
    setIsReanalyzing(true);
    try {
      await runPipelineDetection(metrics);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const drawBoundingBoxes = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !detectionResult?.boxes) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxes = detectionResult.boxes;
    boxes.forEach((box) => {
      // Calculate pixel coordinates
      const x1 = box.x1 <= 1 ? box.x1 * canvas.width : box.x1;
      const y1 = box.y1 <= 1 ? box.y1 * canvas.height : box.y1;
      const x2 = box.x2 <= 1 ? box.x2 * canvas.width : box.x2;
      const y2 = box.y2 <= 1 ? box.y2 * canvas.height : box.y2;
      const width = x2 - x1;
      const height = y2 - y1;

      const strokeColor = box.color || '#22c55e';

      // Draw bounding box rectangle
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = Math.max(3, Math.floor(canvas.width / 250));
      ctx.strokeRect(x1, y1, width, height);

      // Label background fill
      const labelText = `${box.label} (${(box.confidence * 100).toFixed(0)}%)`;
      ctx.font = `bold ${Math.max(14, Math.floor(canvas.width / 40))}px sans-serif`;
      const textMetrics = ctx.measureText(labelText);
      const textHeight = Math.max(18, Math.floor(canvas.width / 35));

      ctx.fillStyle = strokeColor;
      ctx.fillRect(x1, y1 - textHeight - 4 < 0 ? y1 : y1 - textHeight - 4, textMetrics.width + 12, textHeight + 4);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x1 + 6, y1 - textHeight - 4 < 0 ? y1 + textHeight - 2 : y1 - 6);
    });
  };

  const pythonServerCode = `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
import base64
import io
from PIL import Image

app = FastAPI(title="FarmAI YOLOv8 Server")

# Load your custom crop disease or weed YOLOv8 model
model = YOLO("${config.modelName || 'yolov8n.pt'}")

class PredictRequest(BaseModel):
    image: str # Base64 encoded image string
    confidence: float = ${config.confidenceThreshold}

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "${config.modelName}"}

@app.post("/predict")
def predict(req: PredictRequest):
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(req.image)
        img = Image.open(io.BytesIO(image_bytes))
        
        # Run YOLOv8 inference
        results = model.predict(source=img, conf=req.confidence)
        
        boxes = []
        for r in results:
            for box in r.boxes:
                # Normalize coordinates (0.0 to 1.0)
                xyxy = box.xyxyn[0].tolist()
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                
                boxes.append({
                    "x1": round(xyxy[0], 4),
                    "y1": round(xyxy[1], 4),
                    "x2": round(xyxy[2], 4),
                    "y2": round(xyxy[3], 4),
                    "label": label,
                    "confidence": round(conf, 4)
                })
                
        return {"boxes": boxes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run server: uvicorn main:app --host 0.0.0.0 --port 8000`;

  const copyPythonCode = () => {
    navigator.clipboard.writeText(pythonServerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div id="yolo-connector-container" className="space-y-8">
      {/* Editorial Header */}
      <div className="bg-editorial-forest text-white p-8 md:p-10 border border-editorial-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-emerald-400" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-emerald-300 font-sans">Computer Vision Module</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight">
            YOLOv8 <em>Real-Time</em> Object Detection
          </h2>
          <p className="text-emerald-100/80 text-xs font-serif leading-relaxed">
            Connect FarmAI directly to your custom YOLOv8 PyTorch model server or Roboflow API. Detect bounding boxes for crop diseases, leaf lesions, armyworms, and weeds.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/10 p-4 border border-white/15 rounded-none font-mono text-xs">
          <Cpu className="w-6 h-6 text-emerald-300" />
          <div>
            <div className="text-[10px] uppercase text-emerald-300 tracking-wider font-bold font-sans">Status</div>
            <div className="text-white font-bold">{testStatus.state === 'success' ? 'YOLOv8 Connected' : 'Emulator / Ready'}</div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* Live YOLOv8 Image Upload & Bounding Box Visualizer */}
        <div className="w-full">
          <div className="bg-white border border-editorial-border p-6 space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-editorial-border/60">
              <h3 className="font-serif font-bold text-editorial-dark text-base flex items-center gap-2">
                <Eye className="w-4.5 h-4.5 text-editorial-sage" /> YOLOv8 Interactive Canvas Detection
              </h3>
              <label className="cursor-pointer bg-editorial-sand hover:bg-editorial-sand/80 text-editorial-dark font-sans font-bold text-xs px-3 py-1.5 border border-editorial-border flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-editorial-sage" /> Select Crop Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {selectedImage ? (
              <div className="space-y-4">
                {/* Image + Bounding Box Canvas Overlay */}
                <div className="relative border border-editorial-border bg-editorial-dark flex justify-center items-center overflow-hidden min-h-[320px]">
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Selected Crop"
                    onLoad={() => {
                      if (detectionResult?.boxes) drawBoundingBoxes();
                    }}
                    className="max-h-[480px] w-auto object-contain block"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                </div>

                <div className="flex justify-between items-center flex-wrap gap-3">
                  <button
                    onClick={() => runPipelineDetection()}
                    disabled={isDetecting}
                    className="w-full sm:w-auto px-6 py-3.5 bg-editorial-forest text-white font-bold font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-emerald-800 transition-colors shadow-xs"
                  >
                    {isDetecting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running YOLOv8 + FGCN Graph Engine...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-emerald-400" />
                        Execute YOLOv8 & Action Engine Pipeline
                      </>
                    )}
                  </button>

                  {detectionResult && (
                    <span className="text-xs font-mono text-editorial-sage bg-editorial-sand px-3 py-1.5 border border-editorial-border">
                      {detectionResult.modelUsed} ({detectionResult.processingTimeMs}ms)
                    </span>
                  )}
                </div>

                {/* Render Disease Pipeline Card if available */}
                {pipelineResult && (
                  <div className="pt-6 border-t border-editorial-border">
                    <DiseasePipelineCard
                      result={pipelineResult}
                      selectedImage={selectedImage}
                      onFieldMetricsChange={handleFieldMetricsChange}
                      isReanalyzing={isReanalyzing}
                    />
                  </div>
                )}

                {/* Detected Bounding Boxes Summary */}
                {detectionResult && (
                  <div className="p-4 bg-editorial-sand/40 border border-editorial-border space-y-3 font-sans text-xs">
                    <div className="font-bold text-editorial-dark flex items-center justify-between">
                      <span>Detected Objects: {detectionResult.boxes.length}</span>
                      <span className="text-[10px] text-editorial-sage uppercase font-mono">{detectionResult.summaryText}</span>
                    </div>

                    {detectionResult.boxes.length === 0 ? (
                      <p className="text-editorial-sage italic text-xs">No targets exceeded confidence threshold ({config.confidenceThreshold}). Try lowering threshold.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {detectionResult.boxes.map((box, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-editorial-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: box.color || '#22c55e' }} />
                              <span className="font-bold text-editorial-dark">{box.label}</span>
                            </div>
                            <span className="font-mono text-editorial-forest font-bold">
                              {(box.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-editorial-border p-12 text-center space-y-4 bg-editorial-sand/20">
                <div className="w-12 h-12 bg-editorial-sand mx-auto flex items-center justify-center text-editorial-sage">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif font-bold text-editorial-dark">No Crop Photo Selected</p>
                  <p className="text-xs text-editorial-sage font-sans max-w-sm mx-auto">
                    Upload a leaf, plant stalk, or farm field photo to test real-time object detection using YOLOv8 bounding boxes.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer bg-editorial-forest text-white font-sans font-bold text-xs px-4 py-2 hover:bg-emerald-800 transition-colors">
                  Upload Plant Photo
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
