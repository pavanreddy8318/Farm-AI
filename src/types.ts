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
