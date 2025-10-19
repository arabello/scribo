import * as React from "react";

interface TextHighlightLayerProps {
  content: string;
  highlights: string[];
  className?: string;
}

const TextHighlightLayer = React.forwardRef<
  HTMLDivElement,
  TextHighlightLayerProps
>(function TextHighlightLayer(
  { content, highlights, className = "" },
  ref,
): React.JSX.Element {
  const highlightsRef = React.useRef<HTMLDivElement>(null);

  // Apply highlights to text content
  const applyHighlights = React.useCallback(
    (text: string): string => {
      if (highlights.length === 0) {
        return text;
      }

      // Ensure text ends with newline to prevent layout issues
      let processedText = text.replace(/\n$/g, "\n\n");

      // Escape HTML to prevent XSS
      processedText = processedText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Apply highlights by wrapping matching text in <mark> tags
      highlights.forEach((highlightText) => {
        if (!highlightText) return;

        // Escape the highlight text for use in regex
        const escapedText = highlightText
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // Replace all occurrences with marked version
        const regex = new RegExp(escapedText, "g");
        processedText = processedText.replace(regex, "<mark>$&</mark>");
      });

      return processedText;
    },
    [highlights],
  );

  // Update highlights div innerHTML when content or highlights change
  React.useEffect(() => {
    if (highlightsRef.current) {
      const highlightedText = applyHighlights(content);
      highlightsRef.current.innerHTML = highlightedText;
    }
  }, [content, highlights, applyHighlights]);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      <div
        ref={highlightsRef}
        className="whitespace-pre-wrap break-words text-transparent"
      />
    </div>
  );
});

export default TextHighlightLayer;
