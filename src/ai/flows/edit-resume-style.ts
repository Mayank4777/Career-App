'use server';

/**
 * @fileOverview Applies stylistic edits to a resume using AI.
 *
 * - editResumeStyle - A function that applies a user's styling request to the resume.
 * - EditResumeStyleInput - The input type for the function.
 * - EditResumeStyleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EnhanceResumeOutputSchema } from '../schemas/resume-enhancer-schema';

const EditResumeStyleInputSchema = z.object({
  currentResume: EnhanceResumeOutputSchema.shape.enhancedResume,
  instruction: z.string().describe('The user\'s instruction for how to change the resume style. For example: "Make the section titles blue and bold." or "Change the font for the body text to a serif font."'),
});
export type EditResumeStyleInput = z.infer<typeof EditResumeStyleInputSchema>;

export const EditResumeStyleOutputSchema = z.object({
  css: z.string().describe('The generated CSS to apply the requested style changes. This should be a string of CSS rules. For example: `h3 { color: blue; font-weight: bold; } .text-xs { font-family: serif; }`'),
});
export type EditResumeStyleOutput = z.infer<typeof EditResumeStyleOutputSchema>;


export async function editResumeStyle(input: EditResumeStyleInput): Promise<EditResumeStyleOutput> {
  return editResumeStyleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editResumeStylePrompt',
  input: { schema: EditResumeStyleInputSchema },
  output: { schema: EditResumeStyleOutputSchema },
  prompt: `You are a CSS expert. A user wants to style their resume. You will be given the current resume content and a natural language instruction.
  
  Your task is to generate a snippet of CSS code that will apply the requested styling to the resume's HTML structure.

  The resume has the following structure:
  - The main container has the class \`resume-preview\`.
  - Section titles are \`h3\` elements.
  - Body content inside sections are \`div\` elements with the class \`text-xs\`.
  - The header containing personal info has a \`header\` tag. The name is an \`h1\`, and contact info is in a \`div\` with class \`text-xs\`.

  Instruction: "{{instruction}}"

  Current Resume Content (for context):
  {{#json-stringify}}
  {{{currentResume}}}
  {{/json-stringify}}

  Generate only the CSS code required to fulfill the user's instruction. Do not include the HTML or any other explanations.
  The CSS should be scoped to the '.resume-preview' class to avoid affecting other parts of the application. For example: \`.resume-preview h3 { color: blue; }\`
  `,
});


const editResumeStyleFlow = ai.defineFlow(
  {
    name: 'editResumeStyleFlow',
    inputSchema: EditResumeStyleInputSchema,
    outputSchema: EditResumeStyleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
