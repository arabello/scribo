import * as v from "valibot";
import { ChecklistItemSchema, type ChecklistItem } from "~/model/checklist";

export function parseChecklist(markdown: string): ChecklistItem[] {
  const lines = markdown.split("\n");
  const items: ChecklistItem[] = [];
  const regex = /^-\s*\[\s*\]\s+(.+)/;
  let id = 1;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      let text = match[1].trim();

      // Clean up markdown formatting in text
      // Remove markdown links but keep the text
      text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // Remove bold/italic markers
      text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
      text = text.replace(/\*([^*]+)\*/g, "$1");

      // Validate the checklist item data
      const result = v.safeParse(ChecklistItemSchema, {
        id,
        text,
      });

      if (result.success) {
        items.push(result.output);
        id++;
      } else {
        console.warn(`Failed to parse checklist item ${id}:`, result.issues);
      }
    }
  }

  return items;
}
