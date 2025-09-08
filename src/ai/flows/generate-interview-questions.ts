'use server';

/**
 * @fileOverview AI tool that generates role-specific interview questions based on the job role.
 *
 * - generateInterviewQuestions - A function that handles the interview question generation process.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  jobRole: z.string().describe('The job role for which to generate interview questions.'),
  timeLeft: z.string().describe('The time left until the interview (e.g., 1 week, 3 days).'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of role-specific interview questions.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an AI assistant designed to generate interview questions for a given job role.

  Based on the job role: {{{jobRole}}} and the time left until the interview: {{{timeLeft}}}, generate a list of relevant interview questions, including both technical and HR-related questions.
  Provide a diverse set of questions to help the user prepare comprehensively.
  The questions should be challenging and insightful, aimed at assessing the candidate's skills, experience, and cultural fit.
  Make sure the questions are tailored to the job role and the time the user has to prepare.
  The response must be only the array of questions.

  Example:
  [
    "Tell me about a time you faced a challenging situation at work and how you resolved it.",
    "Describe your experience with [relevant technology/skill].",
    "Why are you interested in this role?",
    "What are your salary expectations?",
    "Tell me about your biggest strength and weakness.",
    "What is your experience with leading a team?",
  ]
  `,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
