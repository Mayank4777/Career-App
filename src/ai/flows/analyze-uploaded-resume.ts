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
import { enhanceResume, type EnhanceResumeOutput } from './enhance-resume-with-ai';
import { EnhanceResumeInputSchema } from '../schemas/resume-enhancer-schema';

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
    atsScore: z.number().describe('A rating for ATS compatibility out of 10.'),
  }),
});
export type AnalyzeUploadedResumeOutput = z.infer<typeof AnalyzeUploadedResumeOutputSchema>;

export async function analyzeUploadedResume(
  input: AnalyzeUploadedResumeInput
): Promise<AnalyzeUploadedResumeOutput> {
  return analyzeUploadedResumeFlow(input);
}

const extractResumeContentPrompt = ai.definePrompt({
  name: 'extractResumeContentPrompt',
  input: { schema: z.object({ resumeDataUri: z.string() }) },
  output: { schema: EnhanceResumeInputSchema },
  prompt: `You are a resume parser. Extract all the text content from the provided resume file and structure it into the following JSON format.
  If a section is not found, leave the corresponding string field empty.

  Resume: {{media url=resumeDataUri}}
  
  Extract the content into the provided JSON schema.`,
});

const enhanceAnalyzedResumeFlow = ai.defineFlow({
  name: 'enhanceAnalyzedResumeFlow',
  inputSchema: AnalyzeUploadedResumeInputSchema,
  outputSchema: EnhanceResumeOutputSchema,
}, async (input) => {
  const { output: extractedContent } = await extractResumeContentPrompt(input);
  if (!extractedContent) {
    throw new Error('Failed to extract content from resume.');
  }
  const enhancedResume = await enhanceResume(extractedContent);
  return enhancedResume;
});

export async function enhanceAnalyzedResume(input: AnalyzeUploadedResumeInput): Promise<EnhanceResumeOutput> {
  return enhanceAnalyzedResumeFlow(input);
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
      - ATS Score: Provide a rating for the resume's ATS compatibility on a scale of 1 to 10.

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
