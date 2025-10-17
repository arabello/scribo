import * as React from "react";
import { guidelines } from "~/data/guidelines";
import { cn } from "~/lib/utils";
import type { GuidelineViolation } from "~/model/guideline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface GuidelinesSectionProps {
  isAnalyzing: boolean;
  violations: GuidelineViolation[];
  selectedGuidelineId: number | null;
  onSelectGuideline: (id: number | null) => void;
}

export default function GuidelinesSection({
  isAnalyzing,
  violations,
  selectedGuidelineId,
  onSelectGuideline,
}: GuidelinesSectionProps): React.JSX.Element {
  // Calculate violation counts per guideline and group violations
  const violationData = React.useMemo(() => {
    const counts: Record<number, number> = {};
    const byGuideline: Record<number, GuidelineViolation[]> = {};

    violations.forEach((v) => {
      counts[v.guidelineId] = (counts[v.guidelineId] || 0) + 1;
      if (!byGuideline[v.guidelineId]) {
        byGuideline[v.guidelineId] = [];
      }
      byGuideline[v.guidelineId].push(v);
    });

    return { counts, byGuideline };
  }, [violations]);

  const handleClick = (id: number): void => {
    // Toggle selection: if already selected, deselect
    onSelectGuideline(selectedGuidelineId === id ? null : id);
  };

  return (
    <div className="h-full flex flex-col border-l border-b border-border relative overflow-hidden">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Analyzing...</div>
        </div>
      )}
      <div className="px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold">Guidelines</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 min-h-0">
        <TooltipProvider delayDuration={300}>
          <div className="space-y-2">
            {guidelines.map((guideline) => {
              const guidelineViolations =
                violationData.byGuideline[guideline.id] || [];
              const hasViolations = violationData.counts[guideline.id] > 0;

              const tooltipContent = hasViolations ? (
                <div className="space-y-2 max-w-sm">
                  {guidelineViolations.map((v, idx) => (
                    <div key={idx} className="text-xs">
                      <p className="font-medium">Reason:</p>
                      <p className="text-muted-foreground">{v.reason}</p>
                      {v.textVerbatim && v.textVerbatim.length > 0 && (
                        <div className="mt-1">
                          <p className="font-medium">Text:</p>
                          {v.textVerbatim.map((text, textIdx) => (
                            <p
                              key={textIdx}
                              className="text-muted-foreground italic truncate"
                            >
                              "{text}"
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null;

              const guidelineCard = (
                <div
                  key={guideline.id}
                  onClick={() => handleClick(guideline.id)}
                  className={cn(
                    "p-3 rounded-md cursor-pointer transition-colors",
                    selectedGuidelineId === guideline.id
                      ? "bg-accent"
                      : "hover:bg-accent/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {guideline.id}. {guideline.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {guideline.description}
                      </div>
                    </div>
                    {hasViolations && (
                      <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full shrink-0">
                        {violationData.counts[guideline.id]}
                      </span>
                    )}
                  </div>
                </div>
              );

              return hasViolations ? (
                <Tooltip key={guideline.id}>
                  <TooltipTrigger asChild>{guidelineCard}</TooltipTrigger>
                  <TooltipContent side="left" className="max-w-md">
                    {tooltipContent}
                  </TooltipContent>
                </Tooltip>
              ) : (
                guidelineCard
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
