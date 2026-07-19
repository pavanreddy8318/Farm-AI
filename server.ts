/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { getUsers, saveUsers, hashPassword, generateToken, verifyToken } from './src/auth-helper';

// Load environment variables
dotenv.config();

// Lazy initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined. Please configure it in your Settings > Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Robust helper to perform gemini generation with automatic model-level fallback and backoff retries
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  }
): Promise<any> {
  const modelsToTry = [params.model, 'gemini-3.1-flash-lite'];
  // Deduplicate
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const model of uniqueModels) {
    let retries = 2;
    while (retries >= 0) {
      try {
        console.log(`[FarmAI] Attempting generateContent with model ${model} (Retries left: ${retries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`[FarmAI] Error with model ${model}:`, err.message || err);
        
        const errMsg = (err.message || '').toLowerCase();
        // Skip retrying or model fallback if it is a client/user input schema issue (e.g. 400 Bad Request)
        if (errMsg.includes('400') || errMsg.includes('invalid_argument')) {
          throw err;
        }

        if (retries > 0) {
          const waitTime = (3 - retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        retries--;
      }
    }
  }

  throw lastError || new Error('Failed to generate content after retries.');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a size limit (for image uploads)
  app.use(express.json({ limit: '15mb' }));

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Authentication endpoints
  app.post('/api/auth/register', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
      }

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        res.status(400).json({ error: 'Username must be at least 3 characters long.' });
        return;
      }
      if (password.length < 4) {
        res.status(400).json({ error: 'Password must be at least 4 characters long.' });
        return;
      }

      const users = getUsers();
      const existingUser = users.find((u) => u.username === cleanUsername);
      if (existingUser) {
        res.status(400).json({ error: 'Username is already taken.' });
        return;
      }

      const newUser = {
        username: cleanUsername,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      const token = generateToken(cleanUsername);
      res.json({ success: true, token, username: cleanUsername });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
      }

      const cleanUsername = username.trim().toLowerCase();
      const users = getUsers();
      const user = users.find((u) => u.username === cleanUsername);

      if (!user) {
        res.status(401).json({ error: 'Invalid username or password.' });
        return;
      }

      const hashedInput = hashPassword(password);
      if (user.passwordHash !== hashedInput) {
        res.status(401).json({ error: 'Invalid username or password.' });
        return;
      }

      const token = generateToken(cleanUsername);
      res.json({ success: true, token, username: cleanUsername });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  });

  app.get('/api/auth/verify', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied. No token provided.' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        res.status(401).json({ error: 'Invalid or expired token.' });
        return;
      }

      res.json({ success: true, username: decoded.username });
    } catch (err: any) {
      console.error('Token verification error:', err);
      res.status(500).json({ error: 'Internal server error during verification.' });
    }
  });

  // 1. Agronomist Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: 'Invalid or empty messages list.' });
        return;
      }

      const ai = getGeminiClient();

      // Construct conversational contents
      // Match @google/genai contents format: array of { role, parts: [{ text }] }
      const contents = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: 'You are an expert agronomist, plant pathologist, and agricultural consultant named FarmAI Agronomist. Your mission is to assist farmers, home gardeners, and agricultural students. Provide highly practical, scientifically accurate, and sustainable (organic-first when possible) farming advice. Keep responses friendly, structured with clear Markdown bullet points, and actionable. Avoid generic warnings; instead offer precise agricultural solutions.',
          temperature: 0.7,
        },
      });

      const responseText = response.text || "I'm sorry, I couldn't formulate a response. Please try again.";
      res.json({ text: responseText });
    } catch (error: any) {
      console.error('Chat API Error:', error);
      res.status(500).json({ error: error.message || 'An error occurred during chat generation.' });
    }
  });

  // 2. Crop disease analysis / diagnosis endpoint
  app.post('/api/diagnose', async (req, res) => {
    try {
      const { imageBase64, mimeType, additionalNotes } = req.body;
      if (!imageBase64 || !mimeType) {
        res.status(400).json({ error: 'An image (base64) and mimeType are required.' });
        return;
      }

      const ai = getGeminiClient();

      // Clean image input base64 string
      let base64Data = imageBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }

      // Set up image part
      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      };

      const promptText = `Analyze this crop leaf/plant image carefully as a professional plant pathologist. Detect the crop species and assess its health. If there are signs of disease, pests, nutrient deficiency, or environmental stress, identify the likely disease or problem.
Additional details provided by the farmer: "${additionalNotes || 'None'}"

Please fill out the schema accurately. Be specific in your symptoms and causes. In treatmentPlan, separate chemical methods from organic methods.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, { text: promptText }] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING, description: 'Crop name and variety (e.g. Tomato, Wheat)' },
              healthStatus: { type: Type.STRING, description: "Must be exactly 'Healthy', 'Diseased', or 'Unknown'" },
              diseaseName: { type: Type.STRING, description: 'Scientific or common disease/pest name (null or empty if healthy)' },
              confidenceScore: { type: Type.NUMBER, description: 'Confidence score between 0.0 and 1.0' },
              symptoms: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Visible symptoms on the plant' },
              possibleCauses: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Factors contributing to this condition' },
              treatmentPlan: {
                type: Type.OBJECT,
                properties: {
                  organic: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Organic/biological treatments' },
                  chemical: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Chemical treatments (if necessary, or organic alternatives if none)' }
                },
                required: ['organic', 'chemical']
              },
              preventiveMeasures: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Measures to prevent recurrence' },
              urgencyLevel: { type: Type.STRING, description: "Urgency of intervention: 'Low', 'Medium', or 'High'" }
            },
            required: ['cropName', 'healthStatus', 'confidenceScore', 'symptoms', 'possibleCauses', 'treatmentPlan', 'preventiveMeasures', 'urgencyLevel']
          },
        },
      });

      const jsonText = response.text?.trim() || '{}';
      const diagnosisResult = JSON.parse(jsonText);
      res.json(diagnosisResult);
    } catch (error: any) {
      console.error('Diagnosis API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to complete disease diagnosis.' });
    }
  });

  // 3. Customize planting plan / farming calendar
  app.post('/api/generate-plan', async (req, res) => {
    try {
      const { cropName, soilType, region, variety, wateringAvailability } = req.body;
      if (!cropName || !soilType || !region) {
        res.status(400).json({ error: 'cropName, soilType, and region are required parameters.' });
        return;
      }

      const ai = getGeminiClient();

      const promptText = `Generate an interactive day-by-day and phase-by-phase farming calendar plan for growing:
- Crop: ${cropName}
- Variety: ${variety || 'Standard'}
- Soil Type: ${soilType}
- Region/Climate: ${region}
- Water Availability: ${wateringAvailability || 'Standard Irrigation'}

Construct a sequence of growth stages (e.g. Sowing, Germination, Vegetative, Flowering, Fruiting, Harvesting). Each stage should contain 1-3 highly detailed calendar tasks. The startDay and endDay should count sequentially from Day 0 (sowing/planting). Give actionable guides.`;

      const response = await generateContentWithRetry(ai, {
        model: 'gemini-3.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING },
              variety: { type: Type.STRING },
              soilRequirements: { type: Type.STRING },
              climateRequirements: { type: Type.STRING },
              totalDurationDays: { type: Type.INTEGER, description: 'Total days from planting to harvest' },
              calendar: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'Unique slug or ID (e.g., sowing-prep)' },
                    stageName: { type: Type.STRING, description: 'Stage of growth (e.g., Sowing Phase)' },
                    startDay: { type: Type.INTEGER, description: 'Starting day of this stage (e.g. 0)' },
                    endDay: { type: Type.INTEGER, description: 'Ending day of this stage (e.g. 7)' },
                    taskTitle: { type: Type.STRING, description: 'Main farming action needed' },
                    description: { type: Type.STRING, description: 'Detailed instruction on how to execute' },
                    tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Pro agronomist tips for success' },
                    wateringFrequency: { type: Type.STRING, description: 'Irrigation guide during this phase' },
                    fertilizerInfo: { type: Type.STRING, description: 'Fertilizer/nutrient guidelines (optional)' }
                  },
                  required: ['id', 'stageName', 'startDay', 'endDay', 'taskTitle', 'description', 'tips', 'wateringFrequency']
                }
              },
              generalTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'General seasonal advice or regional warnings' }
            },
            required: ['cropName', 'variety', 'soilRequirements', 'climateRequirements', 'totalDurationDays', 'calendar', 'generalTips']
          }
        }
      });

      const jsonText = response.text?.trim() || '{}';
      const farmingPlan = JSON.parse(jsonText);
      res.json(farmingPlan);
    } catch (error: any) {
      console.error('Plan Generation API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate custom farming plan.' });
    }
  });

  // Integration with Vite dev server or serving static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA routing: send all non-API requests to index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FarmAI] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FarmAI] Server failed to start:', err);
});
