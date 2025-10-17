import * as v from "valibot";

// Valibot schemas
export const GuidelineSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.string(),
});

export const GuidelineViolationSchema = v.object({
  guidelineId: v.pipe(v.number(), v.integer(), v.minValue(1)),
  textVerbatim: v.optional(v.array(v.pipe(v.string(), v.minLength(1)))),
  reason: v.string(),
});

export const AnalysisResultSchema = v.object({
  violations: v.array(GuidelineViolationSchema),
  analyzedAt: v.pipe(v.string(), v.isoTimestamp()),
});

// Infer TypeScript types from schemas
export type Guideline = v.InferOutput<typeof GuidelineSchema>;
export type GuidelineViolation = v.InferOutput<typeof GuidelineViolationSchema>;
export type AnalysisResult = v.InferOutput<typeof AnalysisResultSchema>;

// UI state (not validated from external sources)
export interface AnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
  selectedGuidelineId: number | null;
}
