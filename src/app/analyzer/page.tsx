'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { analyzeUploadedResume, enhanceAnalyzedResume, type AnalyzeUploadedResumeOutput } from '@/ai/flows/analyze-uploaded-resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FileUp, Loader2, BotMessageSquare, SpellCheck, Wrench, ShieldCheck, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

type Feedback = AnalyzeUploadedResumeOutput['feedback'];

export default function ResumeAnalyzerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<Feedback | null>(null);
  const [, setStoredResumes] = useLocalStorage<any>('resumes', {});

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setAnalysisResult(null);
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
    try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const resumeDataUri = reader.result as string;
            const result = await enhanceAnalyzedResume({ resumeDataUri });
            const resumeId = nanoid();

            setStoredResumes(prev => ({
              ...prev,
              [resumeId]: {
                content: result.enhancedResume,
                createdAt: new Date().toISOString(),
              }
            }));
            
            toast({
                title: 'Resume Enhanced!',
                description: 'Your updated resume is ready to edit.',
            });
            router.push(`/editor/${resumeId}`);
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
    } finally {
        setIsEnhancing(false);
    }
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
                      Generate & Edit Enhanced Resume
                  </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        <div className="sticky top-8 lg:col-span-1">
          <Card className="min-h-[60vh]">
              <CardHeader>
                  <CardTitle>What's Next?</CardTitle>
                  <CardDescription>After analyzing your resume, you can generate an AI-enhanced version and open it in our dedicated editor for final touches.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-col items-center justify-center h-96 text-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">The enhanced resume editor will be available after generation.</p>
                  </div>
              </CardContent>
          </Card>
      </div>
      </div>
    </div>
  );
}
