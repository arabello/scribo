export default function SuggestionsSection(): React.JSX.Element {
  return (
    <div className="h-full flex flex-col border-r border-border">
      <div className="px-4 py-3 shrink-0">
        <h2 className="text-sm font-semibold">Suggestions</h2>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto min-h-0">
        {/* Empty content area */}
      </div>
    </div>
  );
}
