'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { type EnhanceResumeOutput } from '@/ai/flows/enhance-resume-with-ai';
import { editResumeStyle } from '@/ai/flows/edit-resume-style';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2, Sparkles, Github, Linkedin, Wand2, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type EnhancedResume = EnhanceResumeOutput['enhancedResume'];

export default function EditorPage() {
  const { id: resumeId } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [resumes, setResumes] = useLocalStorage<any>('resumes', {});
  const [resumeData, setResumeData] = React.useState<any>(null);
  const [editableResume, setEditableResume] = React.useState<EnhancedResume | null>(null);
  const [customCss, setCustomCss] = React.useState('');
  const [styleInstruction, setStyleInstruction] = React.useState('');
  const [isStyling, setIsStyling] = React.useState(false);
  const resumePreviewRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (resumeId && resumes[resumeId as string]) {
      const data = resumes[resumeId as string];
      setResumeData(data);
      setEditableResume(data.content);
      if (data.css) {
        setCustomCss(data.css);
      }
    } else if (resumeId) {
      // If no resume is found for this ID, redirect or show an error
      // toast({ variant: 'destructive', title: 'Resume not found' });
      // router.push('/');
    }
  }, [resumeId, resumes, router, toast]);

  const handleContentChange = (section: keyof EnhancedResume, content: string) => {
    if (editableResume) {
      const newContent = { ...editableResume, [section]: content };
      setEditableResume(newContent);
      // Also update the stored resume
      setResumes(prev => ({
        ...prev,
        [resumeId as string]: { ...resumeData, content: newContent }
      }));
    }
  };

  const handleStyleChange = async () => {
    if (!styleInstruction || !editableResume) return;
    setIsStyling(true);
    try {
      const result = await editResumeStyle({
        currentResume: editableResume,
        instruction: styleInstruction,
      });
      const newCss = customCss + '\n' + result.css;
      setCustomCss(newCss);
      // Update stored CSS
      setResumes(prev => ({
        ...prev,
        [resumeId as string]: { ...resumeData, css: newCss }
      }));
      setStyleInstruction('');
    } catch (error) {
      console.error('Error applying style:', error);
      toast({ variant: 'destructive', title: 'Failed to apply style' });
    } finally {
      setIsStyling(false);
    }
  };
  
  const handleDownload = async () => {
    const input = resumePreviewRef.current;
    if (!input) return;
  
    // Temporarily remove editing indicators for PDF generation
    const elements = input.querySelectorAll('[contenteditable]');
    elements.forEach(el => el.classList.remove('border-dashed', 'border-gray-400', 'p-2', 'focus:ring-1', 'focus:ring-primary'));

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: null });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.height / canvas.width;
      
      const renderHeight = pdfWidth * canvasRatio;
      
      const y = (pdfHeight - renderHeight) / 2;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, y > 0 ? y : 0, pdfWidth, renderHeight);
      pdf.save(`enhanced-resume-${resumeId}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'There was an error creating the PDF file.'
      })
    } finally {
        // Restore editing indicators
        elements.forEach(el => el.classList.add('border-dashed', 'border-gray-400', 'p-2', 'focus:ring-1', 'focus:ring-primary'));
    }
  };

  const handleDeleteCss = () => {
    setCustomCss('');
     setResumes(prev => ({
        ...prev,
        [resumeId as string]: { ...resumeData, css: '' }
      }));
  }

  const getFirstName = (fullName: string | undefined) => !fullName ? '' : fullName.split(' ')[0];
  const getLastName = (fullName: string | undefined) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : '';
  };
  const getContactInfo = (personalInfo: string | undefined) => {
    if (!personalInfo) return '';
    return personalInfo.split('\n').slice(1).join(' | ');
  };
  
  const renderEditableSection = (title: string, content: string | undefined, sectionKey: keyof EnhancedResume) => {
    if (content === undefined) return null;
    return (
      <div className="mb-4">
        <h3 className="text-base font-bold uppercase tracking-wider text-gray-700 mb-2 border-b-2 border-primary pb-1">{title}</h3>
        <div
          contentEditable
          onBlur={(e) => handleContentChange(sectionKey, e.currentTarget.innerText)}
          suppressContentEditableWarning
          className="text-xs text-gray-700 whitespace-pre-wrap border border-dashed border-transparent hover:border-gray-400 p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
        >
          {content}
        </div>
      </div>
    );
  };
  
  if (!resumeData) {
     return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">Loading Editor...</h1>
                <p className="mt-2 text-muted-foreground">If you're not redirected, please select a resume from the builder.</p>
                 <Button onClick={() => router.push('/')} className="mt-4">Go to Builder</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-svh">
      <style>{customCss}</style>
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Resume Editor</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} variant="default" size="sm"><Download className="mr-2" /> Download PDF</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
            <div ref={resumePreviewRef} className="resume-preview bg-white p-8 w-full text-black aspect-[210/297] mx-auto shadow-2xl">
              {editableResume && (
                <>
                  <header className="text-center mb-6">
                      <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">{getFirstName(resumeData.formValues?.personalInfo)} {getLastName(resumeData.formValues?.personalInfo)}</h1>
                      <div className="text-xs text-gray-500 mt-2">
                          {getContactInfo(editableResume.personalInfo)}
                      </div>
                      <div className="flex justify-center items-center space-x-4 mt-2">
                          {resumeData.formValues?.githubLink && (
                            <a href={resumeData.formValues.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                              <Github className="size-3"/>
                              <span>{resumeData.formValues.githubLink.replace('https://', '')}</span>
                            </a>
                          )}
                          {resumeData.formValues?.linkedinProfile && (
                            <a href={resumeData.formValues.linkedinProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary">
                              <Linkedin className="size-3"/>
                              <span>{resumeData.formValues.linkedinProfile.replace('https://', '')}</span>
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
                </>
              )}
            </div>
        </div>
        
        <aside className="lg:col-span-1 sticky top-24 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>AI Style Editor</CardTitle>
                    <CardDescription>Use natural language to customize your resume's appearance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Input 
                            placeholder='e.g., "Make section titles blue"'
                            value={styleInstruction}
                            onChange={e => setStyleInstruction(e.target.value)}
                        />
                        <Button onClick={handleStyleChange} disabled={isStyling} className="w-full">
                            {isStyling ? <Loader2 className="animate-spin" /> : <Wand2 className="mr-2"/>} Apply Style
                        </Button>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Applied Styles</CardTitle>
                    <CardDescription>Review and manage the CSS applied by the AI.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        readOnly
                        value={customCss}
                        className="h-48 text-xs font-mono bg-muted"
                        placeholder="CSS styles will appear here..."
                    />
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" size="sm" onClick={handleDeleteCss} disabled={!customCss}>
                    <Trash2 className="mr-2"/> Reset Styles
                  </Button>
                </CardFooter>
            </Card>
        </aside>
      </main>
    </div>
  );
}

// A simple fallback page for when there are no resumes yet.
const NoResumes = () => {
    const router = useRouter();
    return (
         <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <PencilRuler className="mx-auto h-12 w-12 text-muted-foreground" />
                <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">No Resume Selected</h1>
                <p className="mt-2 text-muted-foreground">Create a resume with the builder to start editing.</p>
                <Button onClick={() => router.push('/')} className="mt-4">Go to Builder</Button>
            </div>
        </div>
    )
}

// The main entry point for the editor route
export function EditorIndexPage() {
    const [resumes] = useLocalStorage<any>('resumes', {});
    const router = useRouter();
    const resumeIds = Object.keys(resumes);
    
    React.useEffect(() => {
        if (resumeIds.length > 0) {
            // Redirect to the most recently created resume
            const sortedResumes = Object.entries(resumes).sort(([,a], [,b]) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            router.replace(`/editor/${sortedResumes[0][0]}`);
        }
    }, [resumeIds, resumes, router]);

    if (resumeIds.length === 0) {
        return <NoResumes />;
    }

    return (
         <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
}
