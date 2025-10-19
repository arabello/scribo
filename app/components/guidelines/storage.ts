import * as v from "valibot";
import {
  GuidelineSchema,
  type Guideline,
  AnalysisResultSchema,
  type AnalysisResult,
} from "~/model/guideline";

const STORAGE_KEY = "scribo-guidelines";
const ANALYSIS_STORAGE_KEY = "scribo-guidelines-analysis";

export function saveGuidelines(guidelines: Guideline[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guidelines));
  } catch (error) {
    console.error("Failed to save guidelines:", error);
  }
}

export function loadGuidelines(): Guideline[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(v.array(GuidelineSchema), JSON.parse(stored));
      if (result.success) return result.output;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load guidelines:", error);
  }
  return [];
}

export function saveAnalysisResult(result: AnalysisResult | null): void {
  try {
    if (result === null) {
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    } else {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(result));
    }
  } catch (error) {
    console.error("Failed to save analysis result:", error);
  }
}

export function loadAnalysisResult(): AnalysisResult | null {
  try {
    const stored = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(AnalysisResultSchema, JSON.parse(stored));
      if (result.success) return result.output;
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load analysis result:", error);
  }
  return null;
}
