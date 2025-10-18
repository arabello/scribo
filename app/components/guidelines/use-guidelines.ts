import * as React from "react";
import type { Guideline, AnalysisResult } from "~/model/guideline";
import { analyzeText } from "~/service/analysis";
import { saveGuidelines, loadGuidelines } from "./storage";
import { getNextId } from "~/lib/utils";
import { encodeGuidelines, decodeGuidelines } from "~/lib/markdown-converter";

interface UseGuidelinesReturn {
  guidelines: Guideline[];
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  isEditMode: boolean;
  markdownContent: string;
  addGuideline: () => void;
  updateGuideline: (id: number, updates: Partial<Guideline>) => void;
  deleteGuideline: (id: number) => void;
  analyze: (content: string) => Promise<void>;
  setGuidelines: React.Dispatch<React.SetStateAction<Guideline[]>>;
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;
  setMarkdownContent: (content: string) => void;
}

export function useGuidelines(): UseGuidelinesReturn {
  const [guidelines, setGuidelines] = React.useState<Guideline[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [markdownContent, setMarkdownContent] = React.useState("");

  // Load from localStorage on mount
  React.useEffect(() => {
    setGuidelines(loadGuidelines());
  }, []);

  // Save to localStorage whenever guidelines change
  React.useEffect(() => {
    if (guidelines.length >= 0) {
      saveGuidelines(guidelines);
    }
  }, [guidelines]);

  const addGuideline = React.useCallback((): void => {
    const newGuideline: Guideline = {
      id: getNextId(guidelines),
      title: "",
      description: "",
    };
    setGuidelines((prev) => [...prev, newGuideline]);
  }, [guidelines]);

  const updateGuideline = React.useCallback(
    (id: number, updates: Partial<Guideline>): void => {
      setGuidelines((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      );
    },
    [],
  );

  const deleteGuideline = React.useCallback((id: number): void => {
    setGuidelines((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const analyze = React.useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || guidelines.length === 0) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeText(content, guidelines);
        setAnalysisResult(result);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "Analysis failed",
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [guidelines],
  );

  const enterEditMode = React.useCallback((): void => {
    const markdown = encodeGuidelines(guidelines);
    setMarkdownContent(markdown);
    setIsEditMode(true);
  }, [guidelines]);

  const exitEditMode = React.useCallback(
    (save: boolean): void => {
      if (save) {
        const parsedGuidelines = decodeGuidelines(markdownContent);
        setGuidelines(parsedGuidelines);
      }
      setIsEditMode(false);
      setMarkdownContent("");
    },
    [markdownContent],
  );

  return {
    guidelines,
    isAnalyzing,
    analysisResult,
    analysisError,
    isEditMode,
    markdownContent,
    addGuideline,
    updateGuideline,
    deleteGuideline,
    analyze,
    setGuidelines,
    enterEditMode,
    exitEditMode,
    setMarkdownContent,
  };
}
