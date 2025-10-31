import { type ActionFunctionArgs } from "react-router";
import OpenAI from "openai";
import * as v from "valibot";
import {
  ChecklistAnalysisResultSchema,
  ChecklistItemSchema,
} from "~/model/checklist";

// Schema for request body validation
const AnalyzeRequestSchema = v.object({
  text: v.pipe(v.string(), v.minLength(1)),
  checklistItems: v.array(ChecklistItemSchema),
});

// Schema for OpenAI response validation
const OpenAIResponseSchema = v.object({
  results: v.array(
    v.object({
      id: v.number(),
      checked: v.boolean(),
      reason: v.optional(v.string()),
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

    const { text, checklistItems } = requestResult.output;

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
    const checklistText = checklistItems
      .map((item) => `${item.id}. ${item.text}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a blog post reviewer. Evaluate if the provided text addresses each checklist item.

For each checklist item, provide:
- id: the ID number of the checklist item
- checked: true if the text adequately addresses this item, false otherwise
- reason: a brief explanation (only required if checked is false, explaining what's missing or inadequate)

Return your response as a JSON object with this structure:
{
  "results": [
    {
      "id": number,
      "checked": boolean,
      "reason": string (only if checked is false)
    }
  ]
}

IMPORTANT:
- The provided text is in markdown format: consider formatting such as bold, underline, etc.
- Include all checklist items in your response
- Set checked to true only if the text clearly addresses the requirement
- For unchecked items, provide a helpful reason explaining what's missing
- Omit the reason field entirely for checked items`,
        },
        {
          role: "user",
          content: `Checklist items to evaluate:\n\n${checklistText}\n\n---\n\nText to analyze:\n\n${text}`,
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
      results: openAIResult.output.results,
      analyzedAt: new Date().toISOString(),
    };

    const finalResult = v.safeParse(
      ChecklistAnalysisResultSchema,
      analysisResult,
    );
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
    console.error("Checklist analysis error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 },
    );
  }
}
