'use server';

/**
 * @fileOverview Enhances a resume with AI by adding missing skills, keywords, and improving phrasing.
 *
 * - enhanceResume - A function that enhances the resume content.
 * - EnhanceResumeInput - The input type for the enhanceResume function.
 * - EnhanceResumeOutput - The return type for the enhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceResumeInputSchema = z.object({
  personalInfo: z.string().describe('Personal information of the user.'),
  education: z.string().describe('Educational background of the user.'),
  skills: z.string().describe('Skills of the user.'),
  projects: z.string().describe('Projects the user has worked on.'),
  achievements: z.string().describe('Achievements of the user.'),
  exampleResume: z
    .string()
    .optional()
    .describe(
      'Optional: An example resume to use as inspiration for layout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* The example resume for inspiration */
    ),
});
export type EnhanceResumeInput = z.infer<typeof EnhanceResumeInputSchema>;

const EnhanceResumeOutputSchema = z.object({
  enhancedResume: z.string().describe('The enhanced resume content.'),
});
export type EnhanceResumeOutput = z.infer<typeof EnhanceResumeOutputSchema>;

export async function enhanceResume(input: EnhanceResumeInput): Promise<EnhanceResumeOutput> {
  return enhanceResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceResumePrompt',
  input: {schema: EnhanceResumeInputSchema},
  output: {schema: EnhanceResumeOutputSchema},
  prompt: `You are an expert resume writer. You will be provided with information about a user's personal info, education, skills, projects, and achievements.

  Based on this information, you will enhance the resume by adding missing skills and keywords, improving phrasing, and ensuring it is well-formatted and professional. Pay special attention to ATS compatibility.

  Consider the example resume as inspiration for layout and style, if provided. You should NOT copy it verbatim.

  User Information:
  Personal Info: {{{personalInfo}}}
  Education: {{{education}}}
  Skills: {{{skills}}}
  Projects: {{{projects}}}
  Achievements: {{{achievements}}}
  {{#if exampleResume}}
  Example Resume: {{media url=exampleResume}}
  {{/if}}

  Enhanced Resume:
  `,
});

const enhanceResumeFlow = ai.defineFlow(
  {
    name: 'enhanceResumeFlow',
    inputSchema: EnhanceResumeInputSchema,
    outputSchema: EnhanceResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
