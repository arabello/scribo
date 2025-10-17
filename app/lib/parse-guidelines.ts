import * as v from "valibot";
import { GuidelineSchema, type Guideline } from "~/model/guideline";

export function parseGuidelines(markdown: string): Guideline[] {
  const lines = markdown.split("\n");
  const guidelines: Guideline[] = [];
  const regex = /^(\d+)\.\s+\*\*([^:*]+)\*\*:\s+(.+)/;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const id = parseInt(match[1], 10);
      const title = match[2].trim();
      let description = match[3].trim();

      // Clean up markdown formatting in description
      // Remove markdown links but keep the text
      description = description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      // Remove bold/italic markers
      description = description.replace(/\*\*([^*]+)\*\*/g, "$1");
      description = description.replace(/\*([^*]+)\*/g, "$1");

      // Validate the guideline data
      const result = v.safeParse(GuidelineSchema, {
        id,
        title,
        description,
      });

      if (result.success) {
        guidelines.push(result.output);
      } else {
        console.warn(`Failed to parse guideline ${id}:`, result.issues);
      }
    }
  }

  return guidelines;
}
