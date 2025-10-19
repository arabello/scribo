import * as React from "react";
import type { ChecklistItem, ChecklistAnalysisResult } from "~/model/checklist";
import { analyzeChecklist } from "~/service/analysis";
import {
  saveChecklistItems,
  loadChecklistItems,
  saveAnalysisResult,
  loadAnalysisResult,
} from "./storage";
import { getNextId } from "~/lib/utils";
import { encodeChecklist, decodeChecklist } from "~/lib/markdown-converter";

interface UseChecklistReturn {
  items: ChecklistItem[];
  isAnalyzing: boolean;
  analysisResult: ChecklistAnalysisResult | null;
  analysisError: string | null;
  isEditMode: boolean;
  markdownContent: string;
  addItem: () => void;
  updateItem: (id: number, text: string) => void;
  deleteItem: (id: number) => void;
  analyze: (content: string) => Promise<void>;
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  enterEditMode: () => void;
  exitEditMode: (save: boolean) => void;
  setMarkdownContent: (content: string) => void;
}

export function useChecklist(): UseChecklistReturn {
  const [items, setItems] = React.useState<ChecklistItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<ChecklistAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [markdownContent, setMarkdownContent] = React.useState("");

  // Load from localStorage on mount
  React.useEffect(() => {
    setItems(loadChecklistItems());
    setAnalysisResult(loadAnalysisResult());
  }, []);

  // Save to localStorage whenever items change
  React.useEffect(() => {
    if (items.length >= 0) {
      saveChecklistItems(items);
    }
  }, [items]);

  // Save analysis result to localStorage whenever it changes
  React.useEffect(() => {
    saveAnalysisResult(analysisResult);
  }, [analysisResult]);

  const addItem = React.useCallback((): void => {
    const newItem: ChecklistItem = {
      id: getNextId(items),
      text: "",
    };
    setItems((prev) => [...prev, newItem]);
  }, [items]);

  const updateItem = React.useCallback((id: number, text: string): void => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }, []);

  const deleteItem = React.useCallback((id: number): void => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const analyze = React.useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim() || items.length === 0) return;

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        const result = await analyzeChecklist(content, items);
        setAnalysisResult(result);
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "Analysis failed",
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [items],
  );

  const enterEditMode = React.useCallback((): void => {
    const markdown = encodeChecklist(items);
    setMarkdownContent(markdown);
    setIsEditMode(true);
  }, [items]);

  const exitEditMode = React.useCallback(
    (save: boolean): void => {
      if (save) {
        const parsedItems = decodeChecklist(markdownContent);
        setItems(parsedItems);
      }
      setIsEditMode(false);
      setMarkdownContent("");
    },
    [markdownContent],
  );

  return {
    items,
    isAnalyzing,
    analysisResult,
    analysisError,
    isEditMode,
    markdownContent,
    addItem,
    updateItem,
    deleteItem,
    analyze,
    setItems,
    enterEditMode,
    exitEditMode,
    setMarkdownContent,
  };
}
