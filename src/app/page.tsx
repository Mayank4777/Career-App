'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { enhanceResume, type EnhanceResumeOutput } from '@/ai/flows/enhance-resume-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Sparkles, Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
});

type FormValues = z.infer<typeof formSchema>;
type EnhancedResume = EnhanceResumeOutput['enhancedResume'];

export default function ResumeBuilderPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [enhancedResume, setEnhancedResume] = React.useState<EnhancedResume | null>(null);
  const [formValues, setFormValues] = React.useState<FormValues | null>(null);
  const resumePreviewRef = React.useRef<HTMLDivElement>(null);

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
    setEnhancedResume(null);
    setFormValues(values);

    try {
      const result = await enhanceResume(values);
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
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Calculate the page margins
      const page = input.querySelector('.resume-page') as HTMLElement;
      if (page) {
          const a4Ratio = 1.414;
          const contentWidth = page.offsetWidth;
          const contentHeight = page.offsetHeight;
          const contentRatio = contentHeight / contentWidth;
          
          let imgWidth = pdfWidth;
          let imgHeight = pdfHeight;
          let x = 0;
          let y = 0;

          if (contentRatio > a4Ratio) {
            imgHeight = pdf.internal.pageSize.getHeight();
            imgWidth = (imgHeight * canvas.width) / canvas.height;
            x = (pdfWidth - imgWidth) / 2;
          } else {
            y = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
          }
          
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
          pdf.save('enhanced-resume.pdf');
      } else {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('enhanced-resume.pdf');
      }

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'There was an error creating the PDF file.'
      })
    }
  };

  const renderSection = (title: string, content: string | undefined) => {
    if (!content) return null;
    return (
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2 border-b-2 border-gray-300 pb-1">{title}</h3>
        <div className="text-xs text-gray-600 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
      </div>
    );
  };
  
  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  }

  const getLastName = (fullName: string | undefined) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  }

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
            <CardDescription>Provide the building blocks for your new resume. All fields are optional.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="personalInfo" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Mayank Parmar" {...field} /></FormControl><FormMessage /></FormItem>
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
                      <div className="bg-gray-100 p-4 rounded-md shadow-inner overflow-y-auto max-h-[60vh]">
                        <div ref={resumePreviewRef} className="resume-page bg-white p-8 aspect-[210/297] w-full text-black">
                          {/* Header */}
                          <div className="text-center bg-gray-100 p-6 -mx-8 -mt-8 mb-6">
                              <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-widest">{getFirstName(formValues?.personalInfo)}</h1>
                              <h2 className="text-4xl font-light text-gray-800 uppercase tracking-widest">{getLastName(formValues?.personalInfo)}</h2>
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                            {/* Left Column */}
                            <div className="col-span-1 pr-6 border-r border-gray-300">
                                {formValues?.githubLink && (
                                  <div className="mb-4 flex items-start gap-2">
                                    <Github className="size-3 mt-0.5 text-gray-600"/>
                                    <a href={formValues.githubLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 break-all">{formValues.githubLink}</a>
                                  </div>
                                )}
                                {formValues?.linkedinProfile && (
                                  <div className="mb-4 flex items-start gap-2">
                                    <Linkedin className="size-3 mt-0.5 text-gray-600"/>
                                    <a href={formValues.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 break-all">{formValues.linkedinProfile}</a>
                                  </div>
                                )}
                                {renderSection('Education', enhancedResume.education)}
                                {renderSection('Soft Skills / Strengths', enhancedResume.softSkills)}
                            </div>

                            {/* Right Column */}
                            <div className="col-span-2">
                                {renderSection('About Me', enhancedResume.aboutMe)}
                                {renderSection('Technical Skills', enhancedResume.skills)}
                                {renderSection('Projects', enhancedResume.projects)}
                                {renderSection('Achievements', enhancedResume.achievements)}
                            </div>
                          </div>
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
