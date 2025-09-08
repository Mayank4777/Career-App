import {z} from 'genkit';

export const EnhanceResumeInputSchema = z.object({
  personalInfo: z.string().describe('Personal information of the user. e.g. Name, Address, Email, Phone.'),
  aboutMe: z.string().describe('A brief "About Me" section for the resume.'),
  education: z.string().describe('Educational background of the user.'),
  skills: z.string().describe('Technical skills of the user.'),
  softSkills: z.string().describe('Soft skills and strengths of the user.'),
  projects: z.string().describe('Projects the user has worked on.'),
  achievements: z.string().describe('Achievements of the user.'),
  githubLink: z.string().optional().describe('Link to the user\'s GitHub profile.'),
  linkedinProfile: z.string().optional().describe('Link to the user\'s LinkedIn profile.'),
  exampleResume: z
    .string()
    .optional()
    .describe(
      'Optional: An example resume to use as inspiration for layout, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' /* The example resume for inspiration */
    ),
});
export type EnhanceResumeInput = z.infer<typeof EnhanceResumeInputSchema>;

export const EnhanceResumeOutputSchema = z.object({
  enhancedResume: z.object({
    personalInfo: z.string(),
    aboutMe: z.string(),
    education: z.string(),
    skills: z.string(),
    softSkills: z.string(),
    projects: z.string(),
    achievements: z.string(),
  }),
});
export type EnhanceResumeOutput = z.infer<typeof EnhanceResumeOutputSchema>;

export const EditResumeStyleInputSchema = z.object({
  currentResume: EnhanceResumeOutputSchema.shape.enhancedResume,
  instruction: z.string().describe('The user\'s instruction for how to change the resume style. For example: "Make the section titles blue and bold." or "Change the font for the body text to a serif font."'),
});

export const EditResumeStyleOutputSchema = z.object({
  css: z.string().describe('The generated CSS to apply the requested style changes. This should be a string of CSS rules. For example: `h3 { color: blue; font-weight: bold; } .text-xs { font-family: serif; }`'),
});
