import { parseGuidelines } from "~/lib/parse-guidelines";
import guidelinesMarkdown from "~/data/guidelines.md?raw";

export const guidelines = parseGuidelines(guidelinesMarkdown);
