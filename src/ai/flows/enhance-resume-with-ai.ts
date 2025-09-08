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
import { EnhanceResumeInput, EnhanceResumeInputSchema, EnhanceResumeOutput, EnhanceResumeOutputSchema } from '../schemas/resume-enhancer-schema';

export type { EnhanceResumeInput, EnhanceResumeOutput };

export async function enhanceResume(input: EnhanceResumeInput): Promise<EnhanceResumeOutput> {
  return enhanceResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceResumePrompt',
  input: {schema: EnhanceResumeInputSchema},
  output: {schema: EnhanceResumeOutputSchema},
  prompt: `You are an expert resume writer. You will be provided with information about a user.

  Based on this information, you will enhance each section of the resume by improving phrasing, adding relevant keywords, and ensuring it is professional. Your response should be structured in JSON format.

  User Information:
  About Me: {{{aboutMe}}}
  Personal Info: {{{personalInfo}}}
  Education: {{{education}}}
  Technical Skills: {{{skills}}}
  Soft Skills: {{{softSkills}}}
  Projects: {{{projects}}}
  Achievements: {{{achievements}}}
  {{#if githubLink}}GitHub: {{{githubLink}}}{{/if}}
  {{#if linkedinProfile}}LinkedIn: {{{linkedinProfile}}}{{/if}}
  {{#if exampleResume}}
  Example Resume: {{media url=exampleResume}}
  {{/if}}

  Now, enhance the user's provided information and output it in the requested JSON schema. For each key in the output, provide the enhanced text for that section of the resume. For example, for the 'skills' key, return the enhanced list of skills.
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
