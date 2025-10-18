import * as v from "valibot";
import { GuidelineSchema, type Guideline } from "~/model/guideline";

const STORAGE_KEY = "scribo-guidelines";

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
