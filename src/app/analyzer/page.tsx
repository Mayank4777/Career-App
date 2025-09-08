'use client';

import * as React from 'react';
import { analyzeUploadedResume, type AnalyzeUploadedResumeOutput } from '@/ai/flows/analyze-uploaded-resume';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileUp, Loader2, BotMessageSquare, SpellCheck, Wrench, ShieldCheck } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Feedback = AnalyzeUploadedResumeOutput['feedback'];

export default function ResumeAnalyzerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<Feedback | null>(null);

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

  const feedbackSections = [
    { key: 'formatting', title: 'Formatting', icon: BotMessageSquare, data: analysisResult?.formatting },
    { key: 'grammar', title: 'Grammar & Spelling', icon: SpellCheck, data: analysisResult?.grammar },
    { key: 'missingSkills', title: 'Missing Skills', icon: Wrench, data: analysisResult?.missingSkills },
    { key: 'atsCompatibility', title: 'ATS Compatibility', icon: ShieldCheck, data: analysisResult?.atsCompatibility },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Resume Analyzer</h1>
        <p className="text-muted-foreground">Upload your resume to get instant AI-powered feedback.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>Upload a PDF, DOC, or DOCX file for analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="resume-file">Resume File</Label>
              <Input id="resume-file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
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
                        <AccordionContent className="text-sm text-muted-foreground prose prose-sm dark:prose-invert">
                          {section.data}
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
          </Card>
        </div>
      </div>
    </div>
  );
}
