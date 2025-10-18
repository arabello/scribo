import * as React from "react";
import type { Route } from "./+types/home";
import SuggestionsSection from "~/components/suggestions-section";
import TextEditorSection from "~/components/text-editor-section";
import Guidelines from "~/components/guidelines/guidelines";
import Checklist from "~/components/checklist/checklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

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

  // Load content from localStorage on mount
  React.useEffect(() => {
    const savedContent = localStorage.getItem("blog-post-content");
    if (savedContent) {
      setPageContent(savedContent);
    }
  }, []);

  // Save content to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem("blog-post-content", pageContent);
  }, [pageContent]);

  return (
    <div className="grid grid-cols-9 h-screen">
      {/* Left column - 1 unit */}
      <div className="col-span-2 flex flex-col">
        <div className="flex-1">
          <SuggestionsSection />
        </div>
      </div>

      {/* Center column - 1 unit */}
      <div className="col-span-4 relative h-screen">
        <TextEditorSection
          content={pageContent}
          onContentChange={setPageContent}
          violations={[]}
          selectedGuidelineId={null}
          isLoading={false}
        />
      </div>

      {/* Right column - 1 unit with full-page tabs */}
      <div className="col-span-3 flex flex-col min-h-0">
        <Tabs defaultValue="guidelines" className="flex flex-col h-full">
          <div className="shrink-0 border-b border-l border-border px-4">
            <TabsList className="h-12 w-full justify-start">
              <TabsTrigger value="guidelines" className="flex-1">
                Guidelines
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex-1">
                Checklist
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="guidelines"
            className="flex-1 mt-0 min-h-0"
            forceMount
          >
            <Guidelines content={pageContent} />
          </TabsContent>

          <TabsContent
            value="checklist"
            className="flex-1 mt-0 min-h-0"
            forceMount
          >
            <Checklist content={pageContent} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
