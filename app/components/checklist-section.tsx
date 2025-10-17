import * as React from "react";
import { checklistItems } from "~/data/checklist";
import { cn } from "~/lib/utils";
import type { ChecklistResult } from "~/model/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Check, Square } from "lucide-react";

interface ChecklistSectionProps {
  isAnalyzing: boolean;
  results: ChecklistResult[];
}

export default function ChecklistSection({
  isAnalyzing,
  results,
}: ChecklistSectionProps): React.JSX.Element {
  // Create results lookup map
  const resultsMap = React.useMemo(() => {
    const map = new Map<number, ChecklistResult>();
    results.forEach((result) => {
      map.set(result.id, result);
    });
    return map;
  }, [results]);

  return (
    <div className="h-full flex flex-col border-l border-border relative overflow-hidden">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-sm text-muted-foreground">Analyzing...</div>
        </div>
      )}
      <div className="px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold">Checklist</h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 min-h-0">
        <TooltipProvider delayDuration={300}>
          <div className="space-y-2">
            {checklistItems.map((item) => {
              const result = resultsMap.get(item.id);
              const isChecked = result?.checked ?? false;
              const reason = result?.reason;

              const itemElement = (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-md transition-colors",
                    isChecked
                      ? "bg-green-50 dark:bg-green-950/20"
                      : "bg-yellow-50 dark:bg-yellow-950/20",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isChecked ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div
                        className={cn(
                          "text-sm",
                          isChecked
                            ? "text-green-900 dark:text-green-100"
                            : "text-yellow-900 dark:text-yellow-100",
                        )}
                      >
                        {item.text}
                      </div>
                    </div>
                  </div>
                </div>
              );

              // Wrap unchecked items with tooltip
              if (!isChecked && reason) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{itemElement}</TooltipTrigger>
                    <TooltipContent side="left" className="max-w-md">
                      <div className="text-xs">
                        <p className="font-medium">Why this is unchecked:</p>
                        <p className="text-muted-foreground mt-1">{reason}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return itemElement;
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
