import * as v from "valibot";

// Valibot schemas
export const ChecklistItemSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  text: v.pipe(v.string(), v.minLength(1)),
});

export const ChecklistResultSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  checked: v.boolean(),
  reason: v.optional(v.string()), // Only for unchecked items
});

export const ChecklistAnalysisResultSchema = v.object({
  results: v.array(ChecklistResultSchema),
  analyzedAt: v.pipe(v.string(), v.isoTimestamp()),
});

// Infer TypeScript types from schemas
export type ChecklistItem = v.InferOutput<typeof ChecklistItemSchema>;
export type ChecklistResult = v.InferOutput<typeof ChecklistResultSchema>;
export type ChecklistAnalysisResult = v.InferOutput<
  typeof ChecklistAnalysisResultSchema
>;

// UI state (not validated from external sources)
export interface ChecklistAnalysisState {
  isAnalyzing: boolean;
  result: ChecklistAnalysisResult | null;
  error: string | null;
}
