import * as v from "valibot";
import { ChecklistItemSchema, type ChecklistItem } from "~/model/checklist";

const STORAGE_KEY = "scribo-checklist";

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
