import { Button } from "~/components/ui/button";

interface ToolbarProps {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasContent: boolean;
}

export default function Toolbar({
  onAnalyze,
  isAnalyzing,
  hasContent,
}: ToolbarProps): React.JSX.Element {
  return (
    <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3">
      <Button onClick={onAnalyze} disabled={isAnalyzing || !hasContent}>
        {isAnalyzing ? "Analyzing..." : "Analyze"}
      </Button>
    </div>
  );
}
