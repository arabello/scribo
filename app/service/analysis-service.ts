import * as v from "valibot";
import { AnalysisResultSchema, type AnalysisResult } from "~/model/guideline";
import {
  ChecklistAnalysisResultSchema,
  type ChecklistAnalysisResult,
} from "~/model/checklist";

// Simple hash function for text
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze/guidelines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }), // Only send text, guidelines are on backend
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Analysis failed");
  }

  const data = await response.json();

  // Validate the response data
  const result = v.safeParse(AnalysisResultSchema, data);

  if (!result.success) {
    console.error("Invalid analysis result from API:", result.issues);
    throw new Error("Received invalid data from analysis API");
  }

  saveAnalysis(text, result.output);
  return result.output;
}

export function saveAnalysis(text: string, result: AnalysisResult): void {
  try {
    const hash = simpleHash(text);
    const key = `blog-analysis-${hash}`;

    // Validate before saving
    const validationResult = v.safeParse(AnalysisResultSchema, result);
    if (!validationResult.success) {
      console.error(
        "Cannot save invalid analysis result:",
        validationResult.issues,
      );
      return;
    }

    localStorage.setItem(key, JSON.stringify(validationResult.output));
  } catch (error) {
    console.error("Failed to save analysis to localStorage:", error);
  }
}

export function loadAnalysis(text: string): AnalysisResult | null {
  try {
    const hash = simpleHash(text);
    const key = `blog-analysis-${hash}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = JSON.parse(stored);

      // Validate the stored data
      const result = v.safeParse(AnalysisResultSchema, parsed);

      if (result.success) {
        return result.output;
      } else {
        console.warn("Invalid data in localStorage, removing:", result.issues);
        localStorage.removeItem(key);
        return null;
      }
    }
  } catch (error) {
    console.error("Failed to load analysis from localStorage:", error);
  }
  return null;
}

export function clearAnalysis(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("blog-analysis-")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Failed to clear analysis from localStorage:", error);
  }
}

export async function analyzeChecklist(
  text: string,
): Promise<ChecklistAnalysisResult> {
  const response = await fetch("/api/analyze/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Checklist analysis failed");
  }

  const data = await response.json();

  // Validate the response data
  const result = v.safeParse(ChecklistAnalysisResultSchema, data);

  if (!result.success) {
    console.error("Invalid checklist analysis result from API:", result.issues);
    throw new Error("Received invalid data from checklist analysis API");
  }

  saveChecklistAnalysis(text, result.output);
  return result.output;
}

export function saveChecklistAnalysis(
  text: string,
  result: ChecklistAnalysisResult,
): void {
  try {
    const hash = simpleHash(text);
    const key = `blog-checklist-${hash}`;

    // Validate before saving
    const validationResult = v.safeParse(ChecklistAnalysisResultSchema, result);
    if (!validationResult.success) {
      console.error(
        "Cannot save invalid checklist analysis result:",
        validationResult.issues,
      );
      return;
    }

    localStorage.setItem(key, JSON.stringify(validationResult.output));
  } catch (error) {
    console.error("Failed to save checklist analysis to localStorage:", error);
  }
}

export function loadChecklistAnalysis(
  text: string,
): ChecklistAnalysisResult | null {
  try {
    const hash = simpleHash(text);
    const key = `blog-checklist-${hash}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      const parsed = JSON.parse(stored);

      // Validate the stored data
      const result = v.safeParse(ChecklistAnalysisResultSchema, parsed);

      if (result.success) {
        return result.output;
      } else {
        console.warn(
          "Invalid checklist data in localStorage, removing:",
          result.issues,
        );
        localStorage.removeItem(key);
        return null;
      }
    }
  } catch (error) {
    console.error(
      "Failed to load checklist analysis from localStorage:",
      error,
    );
  }
  return null;
}
