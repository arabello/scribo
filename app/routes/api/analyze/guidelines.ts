import { type ActionFunctionArgs } from "react-router";
import OpenAI from "openai";
import * as v from "valibot";
import { AnalysisResultSchema, GuidelineSchema } from "~/model/guideline";

// Schema for request body validation
const AnalyzeRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  guidelines: v.array(GuidelineSchema),
});

// Schema for OpenAI response validation
const OpenAIResponseSchema = v.object({
  violations: v.array(
    v.object({
      guidelineId: v.number(),
      textVerbatim: v.optional(v.array(v.string())),
      reason: v.string(),
    }),
  ),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // Validate request body
    const requestResult = v.safeParse(AnalyzeRequestSchema, body);
    if (!requestResult.success) {
      return Response.json(
        {
          error: "Invalid request data",
          issues: requestResult.issues,
        },
        { status: 400 },
      );
    }

    const { text, guidelines } = requestResult.output;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    // Create a detailed prompt for the LLM
    const guidelinesText = guidelines
      .map((g) => `${g.id}. ${g.title}: ${g.description}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a blog post reviewer. Analyze the provided text against the given guidelines and identify violations.

For each violation, provide:
- guidelineId: the ID number of the violated guideline
- textVerbatim: an array of exact text snippets from the content that violate the guideline. Include ONLY the exact text as it appears. If the violation applies to the entire content (not specific text parts), omit this field entirely.
- reason: a brief explanation of why this violates the guideline

Return your response as a JSON object with this structure:
{
  "violations": [
    {
      "guidelineId": number,
      "textVerbatim": [string, ...] (optional - omit if violation applies to entire content),
      "reason": string
    }
  ]
}

IMPORTANT:
- Use textVerbatim to highlight specific problematic text parts
- A single guideline violation can reference multiple text parts
- Omit textVerbatim entirely for violations that apply to the whole content (e.g., missing elements, overall structure issues)
- If there are no violations, return an empty violations array.`,
        },
        {
          role: "user",
          content: `Guidelines to check against:\n\n${guidelinesText}\n\n---\n\nText to analyze:\n\n${text}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      return Response.json(
        { error: "No response from OpenAI" },
        { status: 500 },
      );
    }

    // Parse and validate OpenAI response
    const parsedContent = JSON.parse(content);
    const openAIResult = v.safeParse(OpenAIResponseSchema, parsedContent);

    if (!openAIResult.success) {
      console.error("Invalid OpenAI response format:", openAIResult.issues);
      return Response.json(
        {
          error: "Invalid response format from OpenAI",
          issues: openAIResult.issues,
        },
        { status: 500 },
      );
    }

    // Create and validate the final result
    const analysisResult = {
      violations: openAIResult.output.violations,
      analyzedAt: new Date().toISOString(),
    };

    const finalResult = v.safeParse(AnalysisResultSchema, analysisResult);
    if (!finalResult.success) {
      console.error("Invalid analysis result:", finalResult.issues);
      return Response.json(
        {
          error: "Failed to create valid analysis result",
          issues: finalResult.issues,
        },
        { status: 500 },
      );
    }

    return Response.json(finalResult.output);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}
