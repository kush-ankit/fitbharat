export interface InsightsLike {
  summary?: string;
  warnings?: string[];
  bodyFatEstimate?: { value?: number };
  segments?: Array<{ name?: string; confidence?: number; note?: string }>;
}

export const buildRecommendations = (insights: InsightsLike) => {
  const trainingFocus: string[] = [];
  const nutritionFocus: string[] = [];
  const recoveryFocus: string[] = [];

  const bf = insights.bodyFatEstimate?.value;
  if (typeof bf === 'number') {
    if (bf >= 25) {
      trainingFocus.push('Prioritize low-impact cardio 4x/week and full-body strength 3x/week.');
      nutritionFocus.push('Target a mild calorie deficit and prioritize high-protein meals.');
    } else if (bf <= 12) {
      trainingFocus.push('Focus on progressive overload with compound lifts 4x/week.');
      nutritionFocus.push('Use slight calorie surplus and protein intake of 1.6-2.2g/kg body weight.');
    } else {
      trainingFocus.push('Maintain balanced split: 3 strength sessions + 2 cardio sessions weekly.');
      nutritionFocus.push('Keep maintenance calories and quality whole-food carbs around workouts.');
    }
  }

  const lowConfidenceSegments = (insights.segments || []).filter((s) => (s.confidence ?? 0) < 0.6);
  if (lowConfidenceSegments.length > 0) {
    recoveryFocus.push('Retake photos in consistent lighting and frontal/side poses for better trend tracking.');
  }

  if ((insights.warnings || []).length > 0) {
    recoveryFocus.push('Treat AI output as guidance only; consult a coach/doctor for medical concerns.');
  }

  if (!trainingFocus.length) {
    trainingFocus.push('Build consistency first: minimum 150 minutes moderate activity each week.');
  }
  if (!nutritionFocus.length) {
    nutritionFocus.push('Aim for protein in each meal, hydration, and fiber-rich vegetables daily.');
  }
  if (!recoveryFocus.length) {
    recoveryFocus.push('Sleep 7-9 hours and schedule at least 1 full rest day weekly.');
  }

  return { trainingFocus, nutritionFocus, recoveryFocus };
};
