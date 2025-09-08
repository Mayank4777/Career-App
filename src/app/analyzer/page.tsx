'use client';

import * as React from 'react';
import { analyzeUploadedResume, enhanceAnalyzedResume, type AnalyzeUploadedResumeOutput } from '@/ai/flows/analyze-uploaded-resume';
import { type EnhanceResumeOutput } from '@/ai/flows/enhance-resume-with-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, BotMessageSquare, SpellCheck, Wrench, ShieldCheck, Sparkles, Download, Github, Linkedin } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Feedback = AnalyzeUploadedResumeOutput['feedback'];
type EnhancedResume = EnhanceResumeOutput['enhancedResume'];

export default function ResumeAnalyzerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<Feedback | null>(null);
  const [editableResume, setEditableResume] = React.useState<EnhancedResume | null>(null);
  const resumePreviewRef = React.useRef<HTMLDivElement>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setAnalysisResult(null);
      setEditableResume(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please upload a resume file to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setEditableResume(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onload = async () => {
        const resumeDataUri = reader.result as string;
        const result = await analyzeUploadedResume({ resumeDataUri });
        setAnalysisResult(result.feedback);
        toast({
          title: 'Analysis Complete!',
          description: 'Your resume feedback is ready.',
        });
        setIsLoading(false);
      };
      reader.onerror = (error) => {
        throw error;
      };
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to analyze resume. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!selectedFile) return;

    setIsEnhancing(true);
    setEditableResume(null);
    try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const resumeDataUri = reader.result as string;
            const result = await enhanceAnalyzedResume({ resumeDataUri });
            setEditableResume(result.enhancedResume);
            toast({
                title: 'Resume Enhanced!',
                description: 'Your updated resume is ready to edit and download.',
            });
            setIsEnhancing(false);
        };
        reader.onerror = (error) => {
            throw error;
        };
    } catch (error) {
        console.error('Error enhancing resume:', error);
        toast({
            variant: 'destructive',
            title: 'An error occurred.',
            description: 'Failed to enhance resume. Please try again.',
        });
        setIsEnhancing(false);
    }
  };

  const handleDownload = async () => {
    const input = resumePreviewRef.current;
    if (!input) return;
  
    const elements = input.querySelectorAll('[contenteditable]');
    elements.forEach(el => el.classList.remove('border', 'border-dashed', 'border-gray-400', 'p-1'));

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: null });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const canvasRatio = canvasHeight / canvasWidth;
      
      const renderWidth = pdfWidth;
      const renderHeight = renderWidth * canvasRatio;
      
      const imgData = canvas.toDataURL('image/png');
      const y = (pdfHeight - renderHeight) / 2;

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
        elements.forEach(el => el.classList.add('border', 'border-dashed', 'border-gray-400', 'p-1'));
    }
  };

  const handleContentChange = (section: keyof EnhancedResume, content: string) => {
    if (editableResume) {
      setEditableResume(prev => prev ? { ...prev, [section]: content } : null);
    }
  };
  
  const getFullName = (fullName: string | undefined) => !fullName ? '' : fullName.split('\n')[0];
  
  const getContactInfo = (personalInfo: string | undefined) => {
    if (!personalInfo) return '';
    return personalInfo.split('\n').slice(1).join(' | ');
  }

  const renderEditableSection = (title: string, content: string | undefined, sectionKey: keyof EnhancedResume) => {
    if (content === undefined) return null;
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

  const feedbackSections = [
    { key: 'formatting', title: 'Formatting', icon: BotMessageSquare, data: analysisResult?.formatting },
    { key: 'grammar', title: 'Grammar & Spelling', icon: SpellCheck, data: analysisResult?.grammar },
    { key: 'missingSkills', title: 'Missing Skills', icon: Wrench, data: analysisResult?.missingSkills },
    { key: 'atsCompatibility', title: 'ATS Compatibility', icon: ShieldCheck, data: analysisResult?.atsCompatibility, score: analysisResult?.atsScore },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Analyzer</h1>
        <p className="text-muted-foreground">Upload your resume to get instant AI-powered feedback and an enhanced version.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Resume</CardTitle>
              <CardDescription>Upload a PDF file for analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="resume-file">Resume File</Label>
                <Input id="resume-file" type="file" accept=".pdf" onChange={handleFileChange} />
              </div>
              <Button onClick={handleAnalyze} disabled={isLoading || !selectedFile} className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : <FileUp className="mr-2" />}
                Analyze Resume
              </Button>
            </CardContent>
          </Card>
          
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle>Analysis Feedback</CardTitle>
                <CardDescription>Here's what our AI thinks about your resume.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Loader2 className="size-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Scanning your resume...</p>
                  </div>
                )}
                {analysisResult && !isLoading && (
                  <Accordion type="single" collapsible defaultValue="formatting" className="w-full">
                    {feedbackSections.map((section) => (
                       section.data && (
                        <AccordionItem value={section.key} key={section.key}>
                          <AccordionTrigger className="text-base">
                            <div className="flex items-center gap-3">
                              <section.icon className="size-5 text-primary" />
                              {section.title}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground prose prose-sm dark:prose-invert space-y-2">
                            <p>{section.data}</p>
                            {section.key === 'atsCompatibility' && section.score !== undefined && (
                                <div>
                                    <Label className="text-xs">ATS Score: {section.score}/10</Label>
                                    <Progress value={section.score * 10} className="h-2 mt-1"/>
                                </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      )
                    ))}
                  </Accordion>
                )}
                {!analysisResult && !isLoading && (
                   <div className="flex flex-col items-center justify-center h-64 text-center">
                      <p className="text-muted-foreground">Your feedback will appear here after analysis.</p>
                   </div>
                )}
              </CardContent>
              {analysisResult && !isLoading && (
                <CardFooter>
                    <Button onClick={handleEnhance} disabled={isEnhancing} className="w-full">
                        {isEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />}
                        Generate Enhanced Resume
                    </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>

        <div className="sticky top-8">
            <Card>
                <CardHeader>
                    <CardTitle>AI-Enhanced Resume</CardTitle>
                    <CardDescription>Your generated resume is now editable. Click on a section to make changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isEnhancing ? (
                      <div className="flex flex-col items-center justify-center h-96 space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">AI is updating your resume...</p>
                      </div>
                    ) : editableResume ? (
                      <div className="bg-gray-200 p-8 rounded-lg shadow-lg">
                        <div ref={resumePreviewRef} className="bg-white p-8 w-full text-black aspect-[210/297] mx-auto shadow-2xl">
                          <header className="text-center mb-6">
                              <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">{getFullName(editableResume?.personalInfo)}</h1>
                              <div className="text-xs text-gray-500 mt-2">
                                  {getContactInfo(editableResume.personalInfo)}
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
                {editableResume && !isEnhancing && (
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
