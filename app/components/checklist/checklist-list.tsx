import * as React from "react";
import { cn } from "~/lib/utils";
import { truncateToLines } from "~/lib/utils";
import type { ChecklistItem, ChecklistResult } from "~/model/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Check, Square } from "lucide-react";

interface ChecklistListProps {
  items: ChecklistItem[];
  results: ChecklistResult[];
  onUpdateItem: (id: number, text: string) => void;
}

export default function ChecklistList({
  items,
  results,
  onUpdateItem,
}: ChecklistListProps): React.JSX.Element {
  // Create results lookup map
  const resultsMap = React.useMemo(() => {
    const map = new Map<number, ChecklistResult>();
    results.forEach((result) => {
      map.set(result.id, result);
    });
    return map;
  }, [results]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-2">
        {items.map((item) => {
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
                      "text-sm px-2 py-1 -ml-2",
                      isChecked
                        ? "text-green-900 dark:text-green-100"
                        : "text-yellow-900 dark:text-yellow-100",
                    )}
                  >
                    {item.text ? (
                      truncateToLines(item.text, 3)
                    ) : (
                      <span className="text-muted-foreground italic">
                        No text
                      </span>
                    )}
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
                  <div className="py-3 px-1 text-xs">
                    <p className="font-medium">Why this is unchecked:</p>
                    <p className="text-muted-foreground mt-1">{reason}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }

          return <React.Fragment key={item.id}>{itemElement}</React.Fragment>;
        })}
      </div>
    </TooltipProvider>
  );
}
