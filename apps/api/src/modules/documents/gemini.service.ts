import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiClinicalReport } from '@swastyasetu/shared';
import { ExtractedClinicalField } from './ocr.service';

const CLINICAL_PROMPT = `
You are a senior clinical document intelligence specialist and hospital medical officer at a District Hospital / Referral Centre.
You are analyzing a clinical document (such as a doctor's prescription, discharge summary, referral slip, or lab test order).

You are provided with:
1. An uploaded document image (if available).
2. Raw OCR text extracted by an optical character recognition model (TrOCR) (which may be incomplete, noisy, or have OCR artifacts).

Analyze BOTH the document image and the OCR text with highest medical precision. Decipher doctor handwriting, drug names, dosages, medical shorthand (e.g., OD, BD, TDS, SOS, stat, PO, IV), abbreviations, provisional diagnoses, and lab test instructions.

Provide a comprehensive, hospital-grade clinical analysis report in strict JSON matching the schema below:

{
  "patientInfo": {
    "name": "Patient full name or null",
    "age": "Age string or number or null",
    "gender": "MALE / FEMALE / OTHER or null",
    "abhaId": "ABHA ID or null if not found"
  },
  "clinicalSummary": "A concise, professional 2-4 sentence clinical summary in English explaining the patient presentation, provisional/confirmed condition, treatment strategy, and immediate clinical priority. Must be crystal clear for an attending hospital doctor or medical officer.",
  "diagnoses": [
    {
      "name": "Clinical diagnosis (e.g. Acute STEMI, Type 2 Diabetes Mellitus, Essential Hypertension)",
      "icdCode": "Standard ICD-10 code (e.g. I21.0, E11.9, I10) if identifiable, else null",
      "confidence": 95,
      "severity": "MILD"
    }
  ],
  "medications": [
    {
      "name": "Brand or drug name as written (e.g. Ecosprin, Augmentin, Glycomet)",
      "genericName": "Generic / pharmacological composition (e.g. Aspirin, Amoxicillin + Clavulanic Acid, Metformin)",
      "dosage": "e.g. 75 mg, 625 mg, 500 mg",
      "frequency": "e.g. OD, BD, TDS, QID, SOS, stat",
      "duration": "e.g. 5 days, 1 month, 14 days",
      "route": "Oral / IV / SC / Topical / Inhalation",
      "instructions": "e.g. After meals, Before breakfast, At bedtime",
      "confidence": 92
    }
  ],
  "vitals": {
    "bp": "Blood pressure (e.g. 130/80 mmHg) or null",
    "pulse": "Pulse rate (e.g. 78 bpm) or null",
    "spo2": "Oxygen saturation (e.g. 98%) or null",
    "temperature": "Temperature (e.g. 98.6 F) or null",
    "bloodGlucose": "Blood glucose (e.g. 142 mg/dL) or null",
    "respiratoryRate": "Respiratory rate (e.g. 18/min) or null"
  },
  "labFindings": [
    {
      "test": "Test name (e.g. HbA1c, Serum Creatinine, ECG, Chest X-Ray)",
      "value": "Observed value or ordered status",
      "unit": "Unit of measurement or null",
      "normalRange": "Normal reference range if known",
      "status": "NORMAL"
    }
  ],
  "allergiesAndContraindications": [
    "Known allergy or warning (e.g. Penicillin allergy, avoid NSAIDs due to renal dysfunction)"
  ],
  "clinicalAdvice": [
    "Dietary, lifestyle, or clinical precautions (e.g. Low salt diet, diabetic diet, strict bed rest)"
  ],
  "followUpInstructions": {
    "when": "e.g. After 7 days, In 2 weeks, SOS if chest pain recurs",
    "where": "e.g. Cardiology OPD, Primary Health Centre, Emergency Room",
    "purpose": "e.g. Review blood pressure and repeat ECG"
  },
  "criticalAlerts": [
    "High-priority clinical safety warnings (e.g. High BP detected, Potential drug interaction, Immediate review required)"
  ],
  "documentQuality": {
    "legibilityScore": 85,
    "completenessScore": 90,
    "issues": [
      "Any readability or quality remarks"
    ]
  }
}

CRITICAL RULES:
1. Return ONLY valid JSON, with no wrapping commentary or markdown fences.
2. If any field or section is not mentioned or cannot be inferred with clinical certainty, use null or an empty array [] without guessing dangerously.
3. For severity in diagnoses, use one of: "MILD", "MODERATE", "SEVERE", "CRITICAL".
4. For status in labFindings, use one of: "NORMAL", "LOW", "HIGH", "CRITICAL".
5. For confidence scores, provide integers from 0 to 100.
6. Always prioritize patient safety.
`;

export interface AnalyzeOptions {
  imageBuffer?: Buffer;
  mimeType?: string;
  rawOcrText?: string;
  documentType?: string;
}

export async function analyzeClinicalDocumentWithGemini(
  options: AnalyzeOptions
): Promise<GeminiClinicalReport | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.warn('[GeminiService] GEMINI_API_KEY is not set. Skipping Gemini clinical analysis.');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const CANDIDATE_MODELS = [
      'gemini-3.5-flash-lite', // Primary: ultra-fast (~4.5s), high availability, Google's recommended replacement
      'gemini-flash-latest',   // Secondary: rock-solid fallback
      'gemini-3.8-flash',      // Tertiary: fallback if demand eases
    ];

    const parts: any[] = [];

    // Add prompt instructions
    let contextPrompt = CLINICAL_PROMPT;
    if (options.documentType) {
      contextPrompt += `\nDocument Type declared by clinical staff: ${options.documentType}\n`;
    }
    if (options.rawOcrText && options.rawOcrText.trim()) {
      contextPrompt += `\n--- Raw OCR Text from Optical Extraction ---\n${options.rawOcrText}\n--- End of Raw OCR Text ---\n`;
    }

    parts.push(contextPrompt);

    // Add image part if available
    if (options.imageBuffer && options.imageBuffer.length > 0) {
      const mime = options.mimeType || 'image/jpeg';
      parts.push({
        inlineData: {
          data: options.imageBuffer.toString('base64'),
          mimeType: mime,
        },
      });
    }

    let parsed: GeminiClinicalReport | null = null;

    for (const modelName of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(
            `[GeminiService] Attempting clinical analysis with model: ${modelName} (attempt: ${attempt + 1}, hasImage: ${!!options.imageBuffer}, ocrTextLen: ${options.rawOcrText?.length || 0})`
          );
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          const result = await model.generateContent(parts);
          const response = await result.response;
          const text = response.text();

          if (!text || !text.trim()) {
            console.warn(`[GeminiService] Model ${modelName} returned empty text. Trying next candidate...`);
            break;
          }

          const cleanedJson = text
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '')
            .trim();

          parsed = JSON.parse(cleanedJson);
          if (parsed) {
            console.log(`[GeminiService] Successfully generated clinical report using ${modelName}`);
            break;
          }
        } catch (modelErr: any) {
          const is503 = modelErr?.message?.includes('503') || modelErr?.status === 503;
          if (is503 && attempt === 0) {
            console.warn(`[GeminiService] Model ${modelName} returned 503 (high demand). Retrying in 600ms...`);
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          console.warn(
            `[GeminiService] Model ${modelName} encountered error (${modelErr?.message || modelErr}). Trying next candidate...`
          );
          break;
        }
      }
      if (parsed) break;
    }

    if (!parsed) {
      console.warn('[GeminiService] All Gemini candidate models failed.');
      return null;
    }

    // Normalize documentQuality scores
    if (!parsed.documentQuality) {
      parsed.documentQuality = {
        legibilityScore: 80,
        completenessScore: 85,
        issues: [],
      };
    }

    // Ensure rawOcrText is preserved for auditing
    if (!parsed.rawOcrText && options.rawOcrText) {
      parsed.rawOcrText = options.rawOcrText;
    }

    console.log(`[GeminiService] Report summary: Diagnoses: ${parsed.diagnoses?.length || 0}, Meds: ${parsed.medications?.length || 0}, Critical Alerts: ${parsed.criticalAlerts?.length || 0}`);
    return parsed;
  } catch (error: any) {
    console.error('[GeminiService] Error during Gemini clinical analysis:', error?.message || error);
    return null;
  }
}

/**
 * Maps a structured GeminiClinicalReport into the standardized ExtractedClinicalField[] format
 * required by the SwastyaSetu care record and database schema.
 */
export function mapGeminiReportToClinicalFields(report: GeminiClinicalReport): ExtractedClinicalField[] {
  const fields: ExtractedClinicalField[] = [];

  // 1. Diagnoses
  if (Array.isArray(report.diagnoses)) {
    for (const diag of report.diagnoses) {
      if (!diag.name) continue;
      const conf = typeof diag.confidence === 'number'
        ? (diag.confidence > 1 ? diag.confidence / 100 : diag.confidence)
        : 0.85;
      const icdSuffix = diag.icdCode ? ` (ICD-10: ${diag.icdCode})` : '';
      fields.push({
        fieldName: 'diagnosis',
        rawValue: diag.name,
        normalizedValue: `${diag.name}${icdSuffix}`.trim(),
        confidence: Math.min(Math.max(conf, 0.1), 0.99),
        reviewStatus: conf >= 0.90 ? 'AUTO_ACCEPTED' : 'NEEDS_REVIEW',
      });
    }
  }

  // 2. Medications
  if (Array.isArray(report.medications)) {
    for (const med of report.medications) {
      if (!med.name) continue;
      const conf = typeof med.confidence === 'number'
        ? (med.confidence > 1 ? med.confidence / 100 : med.confidence)
        : 0.85;
      const autoAccept = conf >= 0.90 ? 'AUTO_ACCEPTED' : 'NEEDS_REVIEW';

      const genericSuffix = med.genericName ? ` [${med.genericName}]` : '';
      fields.push({
        fieldName: 'medicine',
        rawValue: med.name,
        normalizedValue: `${med.name}${genericSuffix}`.trim(),
        confidence: Math.min(Math.max(conf, 0.1), 0.99),
        reviewStatus: autoAccept,
      });

      if (med.dosage) {
        fields.push({
          fieldName: 'dosage',
          rawValue: med.dosage,
          normalizedValue: med.dosage.trim(),
          confidence: Math.min(Math.max(conf, 0.1), 0.99),
          reviewStatus: autoAccept,
        });
      }

      if (med.frequency) {
        fields.push({
          fieldName: 'frequency',
          rawValue: med.frequency,
          normalizedValue: med.frequency.trim(),
          confidence: Math.min(Math.max(conf, 0.1), 0.99),
          reviewStatus: autoAccept,
        });
      }

      if (med.duration) {
        fields.push({
          fieldName: 'duration',
          rawValue: med.duration,
          normalizedValue: med.duration.trim(),
          confidence: Math.min(Math.max(conf, 0.1), 0.99),
          reviewStatus: autoAccept,
        });
      }
    }
  }

  // 3. Clinical Advice / Instructions
  if (Array.isArray(report.clinicalAdvice)) {
    for (const adv of report.clinicalAdvice) {
      if (!adv || !adv.trim()) continue;
      fields.push({
        fieldName: 'advice',
        rawValue: adv,
        normalizedValue: adv.trim(),
        confidence: 0.92,
        reviewStatus: 'AUTO_ACCEPTED',
      });
    }
  }

  // 4. Critical Alerts as high-priority Advice if any
  if (Array.isArray(report.criticalAlerts)) {
    for (const alert of report.criticalAlerts) {
      if (!alert || !alert.trim()) continue;
      fields.push({
        fieldName: 'advice',
        rawValue: `CRITICAL ALERT: ${alert}`,
        normalizedValue: `⚠️ ${alert}`.trim(),
        confidence: 0.95,
        reviewStatus: 'AUTO_ACCEPTED',
      });
    }
  }

  return fields;
}
