import * as React from "react";
import type { Route } from "./+types/home";
import SuggestionsSection from "~/components/suggestions-section";
import TextEditorSection from "~/components/text-editor-section";
import GuidelinesSection from "~/components/guidelines-section";
import ChecklistSection from "~/components/checklist-section";
import Toolbar from "~/components/toolbar";
import type { AnalysisState } from "~/model/guideline";
import type { ChecklistAnalysisState } from "~/model/checklist";
import {
  analyzeText,
  loadAnalysis,
  analyzeChecklist,
  loadChecklistAnalysis,
} from "~/service/analysis-service";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog Post Assistant" },
    {
      name: "description",
      content: "Review blog posts against guidelines and checklist",
    },
  ];
}

export default function Home(): React.JSX.Element {
  const [pageContent, setPageContent] = React.useState<string>("");

  const [analysisState, setAnalysisState] = React.useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
    selectedGuidelineId: null,
  });

  const [checklistState, setChecklistState] =
    React.useState<ChecklistAnalysisState>({
      isAnalyzing: false,
      result: null,
      error: null,
    });

  const handleAnalyze = async (): Promise<void> => {
    if (!pageContent.trim()) {
      return;
    }

    // Set both analyzing states
    setAnalysisState((prev) => ({ ...prev, isAnalyzing: true, error: null }));
    setChecklistState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      // Call both analyses in parallel
      const [guidelinesResult, checklistResult] = await Promise.all([
        analyzeText(pageContent),
        analyzeChecklist(pageContent),
      ]);

      setAnalysisState((prev) => ({
        ...prev,
        result: guidelinesResult,
        isAnalyzing: false,
      }));
      setChecklistState((prev) => ({
        ...prev,
        result: checklistResult,
        isAnalyzing: false,
      }));
    } catch (error) {
      setAnalysisState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Analysis failed",
        isAnalyzing: false,
      }));
      setChecklistState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Analysis failed",
        isAnalyzing: false,
      }));
    }
  };

  return (
    <div className="grid grid-cols-3 h-screen">
      {/* Left column - 1 unit */}
      <div className="col-span-1 flex flex-col">
        <div className="flex-1">
          <SuggestionsSection />
        </div>
      </div>

      {/* Center column - 1 unit */}
      <div className="col-span-1 relative h-screen">
        <TextEditorSection
          content={pageContent}
          onContentChange={setPageContent}
          violations={analysisState.result?.violations || []}
          selectedGuidelineId={analysisState.selectedGuidelineId}
          isLoading={false}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Toolbar
            onAnalyze={handleAnalyze}
            isAnalyzing={analysisState.isAnalyzing}
            hasContent={!!pageContent}
          />
        </div>
      </div>

      {/* Right column - 1 unit */}
      <div className="col-span-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <GuidelinesSection
            isAnalyzing={analysisState.isAnalyzing}
            violations={analysisState.result?.violations || []}
            selectedGuidelineId={analysisState.selectedGuidelineId}
            onSelectGuideline={(id: number | null) =>
              setAnalysisState((prev) => ({ ...prev, selectedGuidelineId: id }))
            }
          />
        </div>
        <div className="flex-1 min-h-0">
          <ChecklistSection
            isAnalyzing={checklistState.isAnalyzing}
            results={checklistState.result?.results || []}
          />
        </div>
      </div>
    </div>
  );
}
