import type { Guideline } from "~/model/guideline";
import type { ChecklistItem } from "~/model/checklist";

export function encodeGuidelines(guidelines: Guideline[]): string {
  return guidelines
    .map((g) => `## ${g.id}. ${g.title}\n\n${g.description}\n`)
    .join("\n");
}

export function decodeGuidelines(markdown: string): Guideline[] {
  const guidelines: Guideline[] = [];

  // Split by ## headers, keeping the header text
  const sections = markdown.split(/^## /m).filter(Boolean);

  sections.forEach((section) => {
    const lines = section.trim().split("\n");
    if (lines.length === 0) return;

    const titleLine = lines[0];
    // Match: "1. Title" or just "Title" (auto-assign ID)
    const matchWithId = titleLine.match(/^(\d+)\.\s+(.+)$/);

    if (matchWithId) {
      const id = parseInt(matchWithId[1], 10);
      const title = matchWithId[2].trim();
      const description = lines.slice(1).join("\n").trim();

      if (title) {
        guidelines.push({ id, title, description });
      }
    } else {
      // No ID found, auto-assign
      const title = titleLine.trim();
      if (title) {
        const id =
          guidelines.length > 0
            ? Math.max(...guidelines.map((g) => g.id)) + 1
            : 1;
        const description = lines.slice(1).join("\n").trim();
        guidelines.push({ id, title, description });
      }
    }
  });

  return guidelines;
}

export function encodeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `- [ ] ${item.text}`).join("\n");
}

export function decodeChecklist(markdown: string): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const lines = markdown.split("\n");

  lines.forEach((line) => {
    // Match: "- [ ] text" or "- [x] text" or "- text"
    const matchCheckbox = line.match(/^-\s+\[[ xX]\]\s+(.+)$/);
    const matchSimple = line.match(/^-\s+(.+)$/);

    if (matchCheckbox) {
      const text = matchCheckbox[1].trim();
      if (text) {
        const id = items.length + 1;
        items.push({ id, text });
      }
    } else if (matchSimple) {
      const text = matchSimple[1].trim();
      if (text) {
        const id = items.length + 1;
        items.push({ id, text });
      }
    }
  });

  return items;
}
