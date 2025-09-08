'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { enhanceResume, type EnhanceResumeOutput } from '@/ai/flows/enhance-resume-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  personalInfo: z.string().optional(),
  aboutMe: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
  softSkills: z.string().optional(),
  projects: z.string().optional(),
  achievements: z.string().optional(),
  githubLink: z.string().optional(),
  linkedinProfile: z.string().optional(),
  exampleResume: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeBuilderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [, setStoredResumes] = useLocalStorage<any>('resumes', {});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalInfo: '',
      aboutMe: '',
      education: '',
      skills: '',
      softSkills: '',
      projects: '',
      achievements: '',
      githubLink: '',
      linkedinProfile: '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      const result = await enhanceResume(values);
      const resumeId = nanoid();
      
      setStoredResumes(prev => ({
        ...prev,
        [resumeId]: {
          content: result.enhancedResume,
          formValues: values,
          createdAt: new Date().toISOString(),
        }
      }));

      toast({
        title: 'Resume Enhanced!',
        description: 'Your AI-powered resume is ready for the editor.',
      });
      router.push(`/editor/${resumeId}`);

    } catch (error) {
      console.error('Error enhancing resume:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to enhance resume. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground">Fill in your details and let AI craft a professional resume for you.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
          <CardDescription>Provide the building blocks for your new resume. The more detail, the better the result. All fields are optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="personalInfo" render={({ field }) => (
                <FormItem><FormLabel>Full Name & Contact Info</FormLabel><FormControl><Textarea placeholder="e.g., Mayank Parmar\nAhmedabad, India\nexample@email.com\n123-456-7890" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="aboutMe" render={({ field }) => (
                <FormItem><FormLabel>About Me</FormLabel><FormControl><Textarea placeholder="A passionate and self-motivated computer science student..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="education" render={({ field }) => (
                <FormItem><FormLabel>Education</FormLabel><FormControl><Textarea placeholder="e.g., IMSCIT, GLS University, Ahmedabad (2023-2026)" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="skills" render={({ field }) => (
                <FormItem><FormLabel>Technical Skills</FormLabel><FormControl><Textarea placeholder="e.g., Languages: C, C++, Java, Python..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={form.control} name="softSkills" render={({ field }) => (
                <FormItem><FormLabel>Soft Skills / Strengths</FormLabel><FormControl><Textarea placeholder="e.g., Quick Learner, Team Player..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="projects" render={({ field }) => (
                <FormItem><FormLabel>Projects</FormLabel><FormControl><Textarea placeholder="e.g., Personal Portfolio Website, E-commerce App..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="achievements" render={({ field }) => (
                <FormItem><FormLabel>Achievements</FormLabel><FormControl><Textarea placeholder="e.g., Participated in 3+ hackathons..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="githubLink" render={({ field }) => (
                  <FormItem><FormLabel>GitHub Link</FormLabel><FormControl><Input placeholder="https://github.com/username" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="linkedinProfile" render={({ field }) => (
                  <FormItem><FormLabel>LinkedIn Profile</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/username" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="exampleResume" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Example Resume (Optional)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            form.setValue('exampleResume', event.target?.result as string);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )} />
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />}
                Enhance and Edit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
