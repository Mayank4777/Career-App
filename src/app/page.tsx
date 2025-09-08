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
import { Download, Loader2, Sparkles, Github, Linkedin } from 'lucide-react';
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
  const [editableResume, setEditableResume] = React.useState<EnhancedResume | null>(null);
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
    setEditableResume(null);
    setFormValues(values);

    try {
      const result = await enhanceResume(values);
      setEditableResume(result.enhancedResume);
      toast({
        title: 'Resume Enhanced!',
        description: 'Your AI-powered resume is ready for review and editing.',
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
  
    const elements = input.querySelectorAll('[contenteditable]');
    elements.forEach(el => el.classList.remove('border', 'border-dashed', 'border-gray-400', 'p-2'));

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
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasHeight / canvasWidth;

      const renderWidth = pdfWidth;
      const renderHeight = renderWidth * canvasRatio;
      
      const imgData = canvas.toDataURL('image/png');
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, renderHeight);
      pdf.save('enhanced-resume.pdf');

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'There was an error creating the PDF file.'
      })
    } finally {
        elements.forEach(el => el.classList.add('border', 'border-dashed', 'border-gray-400', 'p-2'));
    }
  };

  const handleContentChange = (section: keyof EnhancedResume, content: string) => {
    if (editableResume) {
      setEditableResume(prev => prev ? { ...prev, [section]: content } : null);
    }
  };

  const renderEditableSection = (title: string, content: string | undefined, sectionKey: keyof EnhancedResume) => {
    if (!content) return null;
    return (
      <div className="mb-4">
        <h3 className="text-base font-bold uppercase tracking-wider text-gray-700 mb-2 border-b border-primary pb-1">{title}</h3>
        <div
          contentEditable
          onBlur={(e) => handleContentChange(sectionKey, e.currentTarget.innerText)}
          suppressContentEditableWarning
          className="text-xs text-gray-700 whitespace-pre-wrap border border-dashed border-gray-400 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
        >
          {content}
        </div>
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
  
  const getContactInfo = (personalInfo: string | undefined) => {
    if (!personalInfo) return '';
    return personalInfo.split('\n').slice(1).join(' | ');
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Builder</h1>
        <p className="text-muted-foreground">Fill in your details, let AI enhance your resume, then edit and download.</p>
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
                    <CardDescription>Your generated resume is now editable. Click on a section to make changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-96 space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">AI is working its magic...</p>
                      </div>
                    ) : editableResume ? (
                      <div className="bg-gray-200 p-8 rounded-lg shadow-lg">
                        <div ref={resumePreviewRef} className="bg-white p-8 w-full text-black aspect-[210/297] mx-auto shadow-2xl">
                          <header className="text-center mb-6">
                              <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">{getFirstName(formValues?.personalInfo)} {getLastName(formValues?.personalInfo)}</h1>
                              <div className="text-xs text-gray-500 mt-2">
                                  {getContactInfo(editableResume.personalInfo)}
                              </div>
                              <div className="flex justify-center items-center space-x-4 mt-2">
                                  {formValues?.githubLink && (
                                    <a href={formValues.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                                      <Github className="size-3"/>
                                      <span>{formValues.githubLink.replace('https://', '')}</span>
                                    </a>
                                  )}
                                  {formValues?.linkedinProfile && (
                                    <a href={formValues.linkedinProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                                      <Linkedin className="size-3"/>
                                      <span>{formValues.linkedinProfile.replace('https://', '')}</span>
                                    </a>
                                  )}
                              </div>
                          </header>
                          
                          <div className="grid grid-cols-3 gap-6">
                            <main className="col-span-2">
                                {renderEditableSection('About Me', editableResume.aboutMe, 'aboutMe')}
                                {renderEditableSection('Projects', editableResume.projects, 'projects')}
                                {renderEditableSection('Achievements', editableResume.achievements, 'achievements')}
                            </main>
                            <aside className="col-span-1">
                                {renderEditableSection('Education', editableResume.education, 'education')}
                                {renderEditableSection('Technical Skills', editableResume.skills, 'skills')}
                                {renderEditableSection('Soft Skills', editableResume.softSkills, 'softSkills')}
                            </aside>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Your enhanced and editable resume will appear here...</p>
                      </div>
                    )}
                </CardContent>
                {editableResume && !isLoading && (
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
