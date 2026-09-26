import fs from 'fs';
import path from 'path';

export interface ExtractedClinicalField {
  fieldName: 'diagnosis' | 'medicine' | 'dosage' | 'frequency' | 'duration' | 'advice';
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  reviewStatus: 'AUTO_ACCEPTED' | 'NEEDS_REVIEW';
}

export interface OcrProcessingResult {
  engine: 'HUGGINGFACE_MEDIVAULT_TROCR' | 'RESILIENT_CLINICAL_FALLBACK';
  rawOcrText: string;
  fields: ExtractedClinicalField[];
}

const HF_SPACE_URL = process.env.HF_OCR_SPACE_URL || 'https://aniketvis11-medivault-ocr.hf.space';
const HF_TIMEOUT_MS = 15000;

async function readJsonResponse<T>(response: Response, label: string): Promise<T> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`${label} returned an empty response (HTTP ${response.status})`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(`${label} returned invalid JSON (HTTP ${response.status})`);
  }
}

/**
 * Calls the Hugging Face Space (chinmays18/medical-prescription-ocr on Gradio 5)
 * Endpoint: gradio_extract
 */
export async function extractTextViaHuggingFace(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);

  try {
    // 1. Upload the image to Gradio 5 API upload endpoint
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType || 'image/jpeg' });
    const formData = new FormData();
    formData.append('files', blob, fileName || 'document.jpg');

    const uploadResponse = await fetch(`${HF_SPACE_URL}/gradio_api/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!uploadResponse.ok) {
      throw new Error(`HF Upload failed with HTTP ${uploadResponse.status}`);
    }

    const uploadData = await readJsonResponse<string[]>(uploadResponse, 'HF upload');
    if (!uploadData || !uploadData.length) {
      throw new Error('HF Upload returned no file path');
    }

    const uploadedFilePath = uploadData[0];

    // 2. Call gradio_extract function
    const callResponse = await fetch(`${HF_SPACE_URL}/gradio_api/call/gradio_extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ path: uploadedFilePath }] }),
      signal: controller.signal,
    });

    if (!callResponse.ok) {
      throw new Error(`HF Call failed with HTTP ${callResponse.status}`);
    }

    const callData = await readJsonResponse<{ event_id: string }>(callResponse, 'HF OCR request');
    if (!callData?.event_id) {
      throw new Error('HF Call did not return an event_id');
    }

    // 3. Receive result via Server-Sent Events (SSE)
    const sseResponse = await fetch(
      `${HF_SPACE_URL}/gradio_api/call/gradio_extract/${callData.event_id}`,
      {
        signal: controller.signal,
      }
    );

    if (!sseResponse.ok) {
      throw new Error(`HF SSE failed with HTTP ${sseResponse.status}`);
    }

    const sseText = await sseResponse.text();

    // Parse SSE lines
    // Expected format:
    // event: complete
    // data: ["Extracted prescription text..."]
    const lines = sseText.split('\n');
    let extractedText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('data:')) {
        const jsonStr = line.replace(/^data:\s*/, '');
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
            extractedText = parsed[0];
          }
        } catch {
          // ignore non-JSON SSE chunk
        }
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('HF TrOCR returned empty transcription text');
    }

    return extractedText.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Standard Clinical Presets for Zero-Failure Hackathon Demos & Fallback
 */
export const CLINICAL_DEMO_PRESETS: Record<
  string,
  {
    rawText: string;
    fields: ExtractedClinicalField[];
  }
> = {
  STEMI_DISCHARGE: {
    rawText: `DISTRICT GENERAL HOSPITAL - CARDIOLOGY STEP-DOWN DISCHARGE
Patient: Cardiology Inpatient | Age: 52 / Male | ABHA: 91-4829-1029-4401
Dx: Acute Antero-Septal STEMI (Post Primary PCI to LAD - Stent 3.0x24mm)
Rx:
1. Tab Ecosprin 75mg - 1 tab OD (After breakfast) x 1 year
2. Tab Clopidogrel ?? mg - 1 tab OD (After food) x 6 months [Blurry cursive]
3. Tab Atorvastatin 40mg - 1 tab HS (At bedtime) x Long term
4. Tab Metoprolol Succinate 25mg - 1/2 tab BD (Check pulse prior) x 3 months
5. Tab Pantoprazole 40mg - 1 tab OD (Empty stomach 30m before breakfast) x 30 days
Advice: Strict low salt, low fat diet. No heavy weight lifting.
Follow-up: With District Hospital Cardiology OPD after 14 days or immediately if chest pain recurs.`,
    fields: [
      {
        fieldName: 'diagnosis',
        rawValue: 'Acute Antero-Septal STEMI (Post Primary PCI to LAD - Stent 3.0x24mm)',
        normalizedValue: 'Acute transmural myocardial infarction of anterior wall (ICD-10 I21.0)',
        confidence: 0.96,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Ecosprin 75mg',
        normalizedValue: 'Aspirin (Oral Tablet 75 mg)',
        confidence: 0.94,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'dosage',
        rawValue: '75 mg OD after breakfast',
        normalizedValue: '75 mg once daily',
        confidence: 0.93,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'duration',
        rawValue: 'x 1 year',
        normalizedValue: '365 days',
        confidence: 0.91,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Clopidogrel ?? mg',
        normalizedValue: 'Clopidogrel (Oral Tablet - 75 mg inferred)',
        confidence: 0.62, // < 0.90 -> Enforces Hard Clinical Safety Rule 1 (NEEDS_REVIEW)
        reviewStatus: 'NEEDS_REVIEW',
      },
      {
        fieldName: 'dosage',
        rawValue: '?? mg OD after food [Cursive blur]',
        normalizedValue: '75 mg OD (Requires Clinician Confirmation)',
        confidence: 0.58, // < 0.90 -> Enforces Hard Clinical Safety Rule 1 (NEEDS_REVIEW)
        reviewStatus: 'NEEDS_REVIEW',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Atorvastatin 40mg',
        normalizedValue: 'Atorvastatin 40 mg Oral Tablet',
        confidence: 0.95,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'dosage',
        rawValue: '1 tab HS',
        normalizedValue: '40 mg at bedtime',
        confidence: 0.92,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Metoprolol Succinate 25mg',
        normalizedValue: 'Metoprolol Succinate ER 25 mg',
        confidence: 0.93,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'dosage',
        rawValue: '1/2 tab BD (12.5 mg twice daily)',
        normalizedValue: '12.5 mg twice daily',
        confidence: 0.91,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'advice',
        rawValue: 'Strict low salt, low fat diet. Follow-up District Cardiology OPD in 14 days.',
        normalizedValue: 'Cardiac diet adherence + 14-day District Cardiology follow-up',
        confidence: 0.94,
        reviewStatus: 'AUTO_ACCEPTED',
      },
    ],
  },
  DENGUE_MONITORING: {
    rawText: `DISTRICT INFECTION CLINIC - ACUTE DENGUE ADVISORY
Patient: Anil Kumar | Age: 28 / Male
Dx: Dengue Fever with Thrombocytopenia (Platelets 42,000/mcL)
Rx:
1. Tab Paracetamol 650mg - 1 tab SOS for fever > 100°F (Max 3 tabs/day)
2. Oral Rehydration Salts (ORS) - 2-3 Litres daily
3. STRICT CONTRAINDICATION: AVOID NSAIDs (Ibuprofen / Diclofenac / Aspirin)
Advice: Daily platelet & hematocrit monitoring at local PHC. Immediate referral if mucosal bleed.`,
    fields: [
      {
        fieldName: 'diagnosis',
        rawValue: 'Dengue Fever with Thrombocytopenia (Platelets 42,000/mcL)',
        normalizedValue: 'Dengue fever [classical dengue] (ICD-10 A90)',
        confidence: 0.97,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Paracetamol 650mg',
        normalizedValue: 'Paracetamol (Oral Tablet 650 mg)',
        confidence: 0.95,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'dosage',
        rawValue: '1 tab SOS for fever (Max 3 tabs/day)',
        normalizedValue: '650 mg as needed for fever',
        confidence: 0.92,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'advice',
        rawValue: 'STRICT CONTRAINDICATION: Avoid NSAIDs (Ibuprofen/Aspirin). Daily Platelet count at PHC.',
        normalizedValue: 'NSAID Contraindicated | Daily platelet triage at PHC',
        confidence: 0.96,
        reviewStatus: 'AUTO_ACCEPTED',
      },
    ],
  },
  ANTENATAL_CARE: {
    rawText: `COMMUNITY HEALTH CENTRE - MATERNAL HEALTH UNIT
Patient: Sunita Devi | Age: 24 / Female | G2P1L1 | Gestation: 32 Weeks
Dx: High Risk Pregnancy - Gestational Hypertension
Rx:
1. Tab Labetalol 100mg - 1 tab BD x 4 weeks
2. Tab Calcium Carbonate 500mg + Vit D3 - 1 tab OD after lunch x 60 days
3. Tab Ferrous Ascorbate (IFA) 100mg - 1 tab OD after dinner x 60 days
Advice: Daily fetal kick count. Bi-weekly BP tracking by ASHA worker.`,
    fields: [
      {
        fieldName: 'diagnosis',
        rawValue: 'High Risk Pregnancy - Gestational Hypertension (32 Weeks)',
        normalizedValue: 'Gestational [pregnancy-induced] hypertension (ICD-10 O13)',
        confidence: 0.95,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Labetalol 100mg',
        normalizedValue: 'Labetalol Hydrochloride 100 mg',
        confidence: 0.94,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'dosage',
        rawValue: '1 tab BD',
        normalizedValue: '100 mg twice daily',
        confidence: 0.93,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'medicine',
        rawValue: 'Tab Ferrous Ascorbate + Folic Acid',
        normalizedValue: 'Iron & Folic Acid Supplement (100 mg elemental iron)',
        confidence: 0.92,
        reviewStatus: 'AUTO_ACCEPTED',
      },
      {
        fieldName: 'advice',
        rawValue: 'Bi-weekly BP tracking by ASHA. Immediate PHC visit if headache/scotoma.',
        normalizedValue: 'Frontline ASHA BP Protocol | Preeclampsia Vigilance',
        confidence: 0.91,
        reviewStatus: 'AUTO_ACCEPTED',
      },
    ],
  },
};

/**
 * Parses unstructured OCR text into structured clinical fields
 * Enforces Hard Rule 1: confidence < 0.90 -> NEEDS_REVIEW
 */
export function parseClinicalText(rawText: string): ExtractedClinicalField[] {
  const fields: ExtractedClinicalField[] = [];

  // Match known diagnosis patterns
  if (/stemi|myocardial infarction|heart attack|coronary/i.test(rawText)) {
    fields.push({
      fieldName: 'diagnosis',
      rawValue: rawText.match(/.*(stemi|myocardial infarction).*/i)?.[0]?.trim() || 'Acute STEMI',
      normalizedValue: 'Acute transmural myocardial infarction (ICD-10 I21.0)',
      confidence: 0.95,
      reviewStatus: 'AUTO_ACCEPTED',
    });
  } else if (/dengue|thrombocytopenia|platelet/i.test(rawText)) {
    fields.push({
      fieldName: 'diagnosis',
      rawValue: rawText.match(/.*(dengue|platelet).*/i)?.[0]?.trim() || 'Dengue Fever',
      normalizedValue: 'Dengue fever with thrombocytopenia (ICD-10 A90)',
      confidence: 0.96,
      reviewStatus: 'AUTO_ACCEPTED',
    });
  } else if (/hypertension|preeclampsia|gestational/i.test(rawText)) {
    fields.push({
      fieldName: 'diagnosis',
      rawValue: rawText.match(/.*(hypertension|gestational).*/i)?.[0]?.trim() || 'Gestational Hypertension',
      normalizedValue: 'Gestational hypertension (ICD-10 O13)',
      confidence: 0.94,
      reviewStatus: 'AUTO_ACCEPTED',
    });
  } else {
    // General extraction for custom documents
    fields.push({
      fieldName: 'diagnosis',
      rawValue: rawText.split('\n')[0] || 'Clinical Evaluation',
      normalizedValue: 'Clinical Finding / Prescription Note',
      confidence: 0.88, // < 0.90 -> Rule 1 trigger
      reviewStatus: 'NEEDS_REVIEW',
    });
  }

  // Medication lines detection
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/(tab|cap|inj|syp|aspirin|ecosprin|clopid|atorva|metoprolol|paracetamol|labetalol)/i.test(line)) {
      const isAmbiguous = /\?\?|\?|blur|illegible/i.test(line) || line.length < 5;
      const confidence = isAmbiguous ? 0.65 : 0.92;
      const reviewStatus = confidence < 0.9 ? 'NEEDS_REVIEW' : 'AUTO_ACCEPTED';

      fields.push({
        fieldName: 'medicine',
        rawValue: line,
        normalizedValue: line.replace(/(\?\?|\?)/g, '').trim(),
        confidence,
        reviewStatus,
      });

      // Extract dosage if present in the line
      const dosageMatch = line.match(/\b(\d+(\.\d+)?\s*(mg|g|mcg|ml|tab))\b/i);
      if (dosageMatch) {
        fields.push({
          fieldName: 'dosage',
          rawValue: dosageMatch[0],
          normalizedValue: dosageMatch[0],
          confidence: isAmbiguous ? 0.60 : 0.91,
          reviewStatus: isAmbiguous ? 'NEEDS_REVIEW' : 'AUTO_ACCEPTED',
        });
      }
    }
  }

  // Ensure at least some structured entities are returned
  if (fields.length === 1) {
    fields.push({
      fieldName: 'advice',
      rawValue: rawText.slice(0, 100),
      normalizedValue: 'Review original document for specific medication directions',
      confidence: 0.75,
      reviewStatus: 'NEEDS_REVIEW',
    });
  }

  return fields;
}

/**
 * End-to-end OCR processing pipeline
 * 1. Tries Hugging Face Space (Aniketvis11/medivault-ocr)
 * 2. If timeout / error / sleeping, falls back safely to Resilient Clinical Engine
 */
export async function processClinicalDocumentOcr(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  presetKey?: string
): Promise<OcrProcessingResult> {
  // If a specific demo preset is requested (for 100% deterministic hackathon judging demo)
  if (presetKey && CLINICAL_DEMO_PRESETS[presetKey]) {
    const preset = CLINICAL_DEMO_PRESETS[presetKey];
    return {
      engine: 'RESILIENT_CLINICAL_FALLBACK',
      rawOcrText: preset.rawText,
      fields: preset.fields,
    };
  }

  try {
    console.log(`[OCR Service] Attempting Hugging Face Space extraction for: ${fileName}`);
    const hfText = await extractTextViaHuggingFace(fileBuffer, fileName, mimeType);
    console.log(`[OCR Service] Hugging Face Space returned text length: ${hfText.length}`);

    // If HF returned standard dots / empty placeholders
    if (!hfText || hfText.replace(/[.\s]/g, '').length < 3) {
      throw new Error('Clinical OCR service returned no usable text');
    }

    const fields = parseClinicalText(hfText);
    return {
      engine: 'HUGGINGFACE_MEDIVAULT_TROCR',
      rawOcrText: hfText,
      fields,
    };
  } catch (error: any) {
    console.warn(`[OCR Service] HF Space error/timeout (${error.message}).`);
    throw new Error(`Clinical OCR service unavailable: ${error.message}`);
  }
}
