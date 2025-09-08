'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { enhanceResume, type EnhanceResumeInput } from '@/ai/flows/enhance-resume-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formSchema = z.object({
  personalInfo: z.string().min(1, 'Please enter your personal information.'),
  education: z.string().min(1, 'Please enter your education details.'),
  skills: z.string().min(1, 'Please list your skills.'),
  projects: z.string().min(1, 'Please describe your projects.'),
  achievements: z.string().min(1, 'Please list your achievements.'),
  exampleResume: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeBuilderPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [enhancedResume, setEnhancedResume] = React.useState('');
  const resumePreviewRef = React.useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalInfo: '',
      education: '',
      skills: '',
      projects: '',
      achievements: '',
    },
  });

  const handleFileRead = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setEnhancedResume('');

    try {
      let exampleResumeDataUri: string | undefined;
      if (values.exampleResume && values.exampleResume[0]) {
        exampleResumeDataUri = await handleFileRead(values.exampleResume[0]);
      }

      const input: EnhanceResumeInput = {
        personalInfo: values.personalInfo,
        education: values.education,
        skills: values.skills,
        projects: values.projects,
        achievements: values.achievements,
        exampleResume: exampleResumeDataUri,
      };

      const result = await enhanceResume(input);
      setEnhancedResume(result.enhancedResume);
      toast({
        title: 'Resume Enhanced!',
        description: 'Your AI-powered resume is ready for review.',
      });
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

  const handleDownload = async () => {
    const input = resumePreviewRef.current;
    if (!input) return;

    try {
      const canvas = await html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('enhanced-resume.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'There was an error creating the PDF file.'
      })
    }
  };

  const renderResumeSections = (resumeText: string) => {
    const sections = resumeText.split(/\n\s*\n/);
    return sections.map((section, index) => {
      const parts = section.split(/:\s*(.*)/s);
      const title = parts[0].trim();
      const content = parts[1]?.trim() || '';

      if (!title) return null;

      return (
        <div key={index} className="mb-4">
          <h2 className="text-lg font-semibold text-primary mb-2 border-b-2 border-primary pb-1">{title}</h2>
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      );
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground">Fill in your details and let our AI craft the perfect resume for you.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Provide the building blocks for your new resume.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="personalInfo" render={({ field }) => (
                  <FormItem><FormLabel>Personal Info</FormLabel><FormControl><Textarea placeholder="e.g., John Doe, Software Engineer, New York..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="education" render={({ field }) => (
                  <FormItem><FormLabel>Education</FormLabel><FormControl><Textarea placeholder="e.g., M.S. in Computer Science, Stanford University..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="skills" render={({ field }) => (
                  <FormItem><FormLabel>Skills</FormLabel><FormControl><Textarea placeholder="e.g., JavaScript, React, Node.js, Python, SQL..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="projects" render={({ field }) => (
                  <FormItem><FormLabel>Projects</FormLabel><FormControl><Textarea placeholder="e.g., Personal Portfolio Website, E-commerce App..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="achievements" render={({ field }) => (
                  <FormItem><FormLabel>Achievements</FormLabel><FormControl><Textarea placeholder="e.g., Won 1st place at Hackathon, Published a paper..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Template Selection</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden cursor-pointer hover:border-primary transition-colors">
                          <Image src={`https://picsum.photos/300/400?random=${i}`} alt={`Template ${i}`} width={300} height={400} className="object-cover w-full h-auto" data-ai-hint="resume template" />
                          <CardFooter className="p-2"><p className="text-sm text-center w-full">Template {i}</p></CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <FormField control={form.control} name="exampleResume" render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Or Upload an Example Layout</FormLabel>
                      <FormControl>
                        <Input type="file" accept=".pdf,.doc,.docx,.png,.jpg" onChange={(e) => onChange(e.target.files)} {...fieldProps} />
                      </FormControl>
                      <FormDescription>Upload a PDF, DOC, or image as a layout inspiration.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />}
                  Enhance with AI
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="sticky top-8">
            <Card>
                <CardHeader>
                    <CardTitle>AI-Enhanced Resume</CardTitle>
                    <CardDescription>Your generated resume. Review the preview below before downloading.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-96 space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">AI is working its magic...</p>
                      </div>
                    ) : enhancedResume ? (
                      <div ref={resumePreviewRef} className="p-4 bg-gray-50 rounded-md shadow-inner overflow-y-auto max-h-[60vh]">
                        <div className="p-6 bg-white min-h-[29.7cm-4rem]">
                            {renderResumeSections(enhancedResume)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-96 text-center">
                        <p className="text-muted-foreground">Your enhanced resume will appear here...</p>
                      </div>
                    )}
                </CardContent>
                {enhancedResume && !isLoading && (
                  <CardFooter>
                    <Button onClick={handleDownload} className="w-full">
                      <Download className="mr-2" />
                      Download as PDF
                    </Button>
                  </CardFooter>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}
