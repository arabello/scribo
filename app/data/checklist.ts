import { parseChecklist } from "~/lib/parse-checklist";
import checklistMarkdown from "~/data/checklist.md?raw";

export const checklistItems = parseChecklist(checklistMarkdown);
