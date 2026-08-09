/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface YoloBoundingBox {
  x1: number; // 0..1 or pixel coordinate
  y1: number;
  x2: number;
  y2: number;
  label: string;
  confidence: number;
  color?: string;
  classId?: number;
}

export interface YoloDetectionResult {
  status: 'success' | 'fallback' | 'error';
  modelUsed: string;
  boxes: YoloBoundingBox[];
  processingTimeMs?: number;
  inferenceServerUrl?: string;
  summaryText?: string;
}

export interface YoloConfig {
  endpointUrl: string;
  apiKey?: string;
  confidenceThreshold: number;
  iouThreshold: number;
  modelName: string;
  useFallback: boolean;
}

export interface DiseaseDiagnosis {
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased' | 'Unknown';
  diseaseName?: string;
  confidenceScore?: number;
  symptoms?: string[];
  possibleCauses?: string[];
  treatmentPlan?: {
    organic: string[];
    chemical: string[];
  };
  preventiveMeasures?: string[];
  urgencyLevel?: 'Low' | 'Medium' | 'High';
  yoloDetections?: YoloBoundingBox[];
}

export interface DiseaseSeverityMetrics {
  dsiPercentage: number; // e.g. 25 (%)
  infectedAreaCm2?: number;
  totalLeafAreaCm2?: number;
  severityGrade: 'Low' | 'Moderate' | 'High' | 'Severe';
}

export interface FgcnFieldMetrics {
  soilMoisturePct: number; // e.g. 80 (%)
  soilPh: number; // e.g. 6.5
  temperatureC: number; // e.g. 28 (°C)
  humidityPct: number; // e.g. 78 (%)
  predictedYieldLossKgPerHa: number; // e.g. 300 (kg/ha)
  graphNodeRiskScore: number; // 0.0..1.0
  relationalRiskFactor: string; // "High moisture + Late Blight increases risk by 40%"
}

export interface ActionableInstructionPlan {
  immediateTreatment: {
    chemicalOrBio: string; // "Spray Copper Fungicide (2g per Liter of water)"
    dosagePerAcre: string; // "400g - 500g in 200L water per acre"
    applicationMethod: string; // "Focus strictly on affected plant zones."
  };
  agronomicAdjustments: {
    irrigationControl: string; // "Stop overhead watering immediately. Switch to drip irrigation for 5 days."
    fertilizerAdjustment: string; // "Reduce Nitrogen application by 10% temporarily."
  };
  preventiveCare: {
    fieldManagement: string[]; // ["Prune lower infected leaves", "Apply straw mulch"]
    surroundingCropProtection: string; // "Protect surrounding crops with bio-fungicide"
  };
  privacySafeguard: {
    badge: string; // "Local image and field metrics processed on-site. Only encrypted weight updates sent to global model."
    encryptedModelHash: string;
  };
}

export interface DiseaseDetectionPipelineResult {
  id?: number | string;
  cropName: string;
  healthStatus: 'Healthy' | 'Diseased' | 'Unknown';
  diseaseName: string; // e.g. "Tomato Late Blight"
  confidenceScore: number; // 0.0..1.0
  severity: DiseaseSeverityMetrics;
  yoloBoxes: YoloBoundingBox[];
  fieldMetrics: FgcnFieldMetrics;
  actionPlan: ActionableInstructionPlan;
  imageUrl?: string;
  createdAt?: string;
}

export interface CalendarTask {
  id: string;
  stageName: string;
  startDay: number;
  endDay: number;
  taskTitle: string;
  description: string;
  tips: string[];
  wateringFrequency: string;
  fertilizerInfo?: string;
}

export interface FarmingPlan {
  cropName: string;
  variety: string;
  soilRequirements: string;
  climateRequirements: string;
  totalDurationDays: number;
  calendar: CalendarTask[];
  generalTips: string[];
}
