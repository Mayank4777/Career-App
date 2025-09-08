'use server';

/**
 * @fileOverview AI flow for analyzing an uploaded resume.
 *
 * This file exports:
 * - `analyzeUploadedResume` - A function that analyzes a resume and provides feedback.
 * - `AnalyzeUploadedResumeInput` - The input type for the analyzeUploadedResume function.
 * - `AnalyzeUploadedResumeOutput` - The return type for the analyzeUploadedResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUploadedResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeUploadedResumeInput = z.infer<typeof AnalyzeUploadedResumeInputSchema>;

const AnalyzeUploadedResumeOutputSchema = z.object({
  feedback: z.object({
    formatting: z.string().describe('Feedback on the resume formatting.'),
    grammar: z.string().describe('Feedback on the resume grammar and spelling.'),
    missingSkills: z
      .string()
      .describe('Suggestions for missing skills to add to the resume.'),
    atsCompatibility: z.string().describe('Feedback on the resume ATS compatibility.'),
  }),
});
export type AnalyzeUploadedResumeOutput = z.infer<typeof AnalyzeUploadedResumeOutputSchema>;

export async function analyzeUploadedResume(
  input: AnalyzeUploadedResumeInput
): Promise<AnalyzeUploadedResumeOutput> {
  return analyzeUploadedResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUploadedResumePrompt',
  input: {schema: AnalyzeUploadedResumeInputSchema},
  output: {schema: AnalyzeUploadedResumeOutputSchema},
  prompt: `You are a resume expert. Analyze the uploaded resume and provide detailed feedback.

      Resume: {{media url=resumeDataUri}}

      Provide feedback in the following areas:
      - Formatting: Analyze the formatting of the resume and provide suggestions for improvement.
      - Grammar: Check the grammar and spelling of the resume and provide corrections.
      - Missing Skills: Identify any missing skills that should be added to the resume based on industry standards.
      - ATS Compatibility: Check the resume for Applicant Tracking System (ATS) compatibility issues.

      Output your feedback in the requested JSON schema. Focus on actionable advice the candidate can apply immediately.`,
});

const analyzeUploadedResumeFlow = ai.defineFlow(
  {
    name: 'analyzeUploadedResumeFlow',
    inputSchema: AnalyzeUploadedResumeInputSchema,
    outputSchema: AnalyzeUploadedResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
