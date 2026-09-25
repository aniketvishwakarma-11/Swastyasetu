/**
 * Multi-field Weighted Fuzzy Matching Engine for Patient Identity Reconciliation
 * Source of Truth: SwasthyaSetu_MediVault_AI_Agent_Project_Spec.md (Section 16)
 *
 * Weights:
 * - Name:    35%
 * - Phone:   25%
 * - Village: 15%
 * - Age:     10%
 * - Gender:   5%
 * - Context: 10%
 */

export interface PatientMatchInput {
  id?: string;
  name: string;
  age: number;
  gender: string;
  phone?: string | null;
  village: string;
  address?: string | null;
}

export interface FieldScore {
  field: string;
  score: number; // 0.00 to 1.00
  weight: number;
  status: 'MATCH' | 'PARTIAL' | 'MISMATCH';
  incomingValue: string | number;
  candidateValue: string | number;
}

export interface MatchEvaluationResult {
  compositeScore: number; // 0.00 to 1.00
  percentage: number; // 0 to 100
  isCandidateMatch: boolean; // threshold >= 75%
  fieldScores: Record<string, FieldScore>;
}

/**
 * Standard Levenshtein distance calculation
 */
function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;

  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion, deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Token sort string similarity (0.0 to 1.0)
 */
function tokenSortSimilarity(s1: string, s2: string): number {
  const clean1 = s1.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const clean2 = s2.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

  if (clean1 === clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;

  const tokens1 = clean1.split(/\s+/).sort().join(' ');
  const tokens2 = clean2.split(/\s+/).sort().join(' ');

  if (tokens1 === tokens2) return 1.0;

  const maxLen = Math.max(tokens1.length, tokens2.length);
  const dist = levenshtein(tokens1, tokens2);
  const sim = Math.max(0, (maxLen - dist) / maxLen);

  // Also check if first tokens (e.g. given name) match exactly
  const t1First = tokens1.split(' ')[0];
  const t2First = tokens2.split(' ')[0];
  if (t1First === t2First && t1First.length >= 3) {
    return Math.max(sim, 0.75);
  }

  return Number(sim.toFixed(2));
}

/**
 * Clean phone string to normalized digits
 */
function normalizePhone(p?: string | null): string {
  if (!p) return '';
  return p.replace(/[^0-9]/g, '').slice(-10);
}

/**
 * Multi-field identity similarity evaluator
 */
export function evaluateIdentityMatch(
  incoming: PatientMatchInput,
  candidate: PatientMatchInput,
  hasSharedContext: boolean = true,
  incomingContext: string = 'PHC Referral Inbound',
  candidateContext: string = 'District Master Registry'
): MatchEvaluationResult {
  const fieldScores: Record<string, FieldScore> = {};

  // 1. Name Scoring (35% weight)
  const nameSim = tokenSortSimilarity(incoming.name, candidate.name);
  fieldScores.name = {
    field: 'name',
    score: nameSim,
    weight: 0.35,
    status: nameSim >= 0.95 ? 'MATCH' : nameSim >= 0.65 ? 'PARTIAL' : 'MISMATCH',
    incomingValue: incoming.name,
    candidateValue: candidate.name,
  };

  // 2. Phone Scoring (25% weight)
  const phone1 = normalizePhone(incoming.phone);
  const phone2 = normalizePhone(candidate.phone);
  let phoneSim = 0.5; // Neutral if missing
  if (phone1 && phone2) {
    if (phone1 === phone2) phoneSim = 1.0;
    else {
      const matchDigits = phone1.split('').filter((digit, idx) => digit === phone2[idx]).length;
      phoneSim = matchDigits >= 7 ? 0.78 : 0.2;
    }
  }
  fieldScores.phone = {
    field: 'phone',
    score: phoneSim,
    weight: 0.25,
    status: phoneSim >= 0.95 ? 'MATCH' : phoneSim >= 0.6 ? 'PARTIAL' : 'MISMATCH',
    incomingValue: incoming.phone || 'Not provided',
    candidateValue: candidate.phone || 'Not provided',
  };

  // 3. Village Scoring (15% weight)
  const villageSim = tokenSortSimilarity(incoming.village, candidate.village);
  fieldScores.village = {
    field: 'village',
    score: villageSim,
    weight: 0.15,
    status: villageSim >= 0.9 ? 'MATCH' : villageSim >= 0.5 ? 'PARTIAL' : 'MISMATCH',
    incomingValue: incoming.village,
    candidateValue: candidate.village,
  };

  // 4. Age Scoring (10% weight)
  const ageDiff = Math.abs(incoming.age - candidate.age);
  const ageSim = ageDiff === 0 ? 1.0 : ageDiff <= 2 ? 0.9 : ageDiff <= 5 ? 0.6 : 0.1;
  fieldScores.age = {
    field: 'age',
    score: ageSim,
    weight: 0.1,
    status: ageSim >= 0.9 ? 'MATCH' : ageSim >= 0.5 ? 'PARTIAL' : 'MISMATCH',
    incomingValue: incoming.age,
    candidateValue: candidate.age,
  };

  // 5. Gender Scoring (5% weight)
  const genderSim =
    incoming.gender.toLowerCase().trim() === candidate.gender.toLowerCase().trim() ? 1.0 : 0.0;
  fieldScores.gender = {
    field: 'gender',
    score: genderSim,
    weight: 0.05,
    status: genderSim === 1.0 ? 'MATCH' : 'MISMATCH',
    incomingValue: incoming.gender,
    candidateValue: candidate.gender,
  };

  // 6. Context Scoring (10% weight)
  const contextSim = hasSharedContext ? 1.0 : 0.5;
  fieldScores.context = {
    field: 'context',
    score: contextSim,
    weight: 0.1,
    status: contextSim === 1.0 ? 'MATCH' : 'PARTIAL',
    incomingValue: incomingContext,
    candidateValue: candidateContext,
  };

  // Compute composite score
  const compositeScore = Number(
    (
      fieldScores.name.score * fieldScores.name.weight +
      fieldScores.phone.score * fieldScores.phone.weight +
      fieldScores.village.score * fieldScores.village.weight +
      fieldScores.age.score * fieldScores.age.weight +
      fieldScores.gender.score * fieldScores.gender.weight +
      fieldScores.context.score * fieldScores.context.weight
    ).toFixed(2)
  );

  return {
    compositeScore,
    percentage: Math.round(compositeScore * 100),
    isCandidateMatch: compositeScore >= 0.75,
    fieldScores,
  };
}
