import * as React from "react";
import { cn } from "~/lib/utils";
import { truncateToLines } from "~/lib/utils";
import type { Guideline, GuidelineViolation } from "~/model/guideline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
interface GuidelinesListProps {
  guidelines: Guideline[];
  violations: GuidelineViolation[];
  selectedGuidelineId: number | null;
  onSelectGuideline: (id: number | null) => void;
  onUpdateGuideline: (id: number, updates: Partial<Guideline>) => void;
}

export default function GuidelinesList({
  guidelines,
  violations,
  selectedGuidelineId,
  onSelectGuideline,
  onUpdateGuideline,
}: GuidelinesListProps): React.JSX.Element {
  // Calculate violation counts
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
    onSelectGuideline(selectedGuidelineId === id ? null : id);
  };

  return (
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
                          className="text-muted-foreground italic"
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
                "p-3 rounded-md transition-colors",
                selectedGuidelineId === guideline.id
                  ? "bg-accent cursor-pointer"
                  : "hover:bg-accent/50 cursor-pointer",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  {/* Title */}
                  <div className="font-medium text-sm px-2 py-1 -ml-2">
                    {guideline.id}.{" "}
                    {guideline.title || (
                      <span className="text-muted-foreground italic">
                        No title
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-xs text-muted-foreground px-2 py-1 -ml-2 whitespace-pre-wrap">
                    {guideline.description ? (
                      truncateToLines(guideline.description, 3)
                    ) : (
                      <span className="italic">No description</span>
                    )}
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
            <React.Fragment key={guideline.id}>{guidelineCard}</React.Fragment>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
