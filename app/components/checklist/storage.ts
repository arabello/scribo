import * as v from "valibot";
import {
  ChecklistItemSchema,
  type ChecklistItem,
  ChecklistAnalysisResultSchema,
  type ChecklistAnalysisResult,
} from "~/model/checklist";

const STORAGE_KEY = "scribo-checklist";
const ANALYSIS_STORAGE_KEY = "scribo-checklist-analysis";

export function saveChecklistItems(items: ChecklistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save checklist:", error);
  }
}

export function loadChecklistItems(): ChecklistItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(
        v.array(ChecklistItemSchema),
        JSON.parse(stored),
      );
      if (result.success) return result.output;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load checklist:", error);
  }
  return [];
}

export function saveAnalysisResult(
  result: ChecklistAnalysisResult | null,
): void {
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

export function loadAnalysisResult(): ChecklistAnalysisResult | null {
  try {
    const stored = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    if (stored) {
      const result = v.safeParse(
        ChecklistAnalysisResultSchema,
        JSON.parse(stored),
      );
      if (result.success) return result.output;
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
    }
  } catch (error) {
    console.error("Failed to load analysis result:", error);
  }
  return null;
}
