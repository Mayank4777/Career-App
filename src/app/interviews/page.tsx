'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lightbulb, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  jobRole: z.string().min(2, 'Please enter a valid job role.'),
  timeLeft: z.string().min(1, 'Please select the time left.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function InterviewPrepPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [questions, setQuestions] = React.useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobRole: '',
      timeLeft: '1 week',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setQuestions([]);
    try {
      const result = await generateInterviewQuestions(values);
      setQuestions(result.questions);
      toast({
        title: 'Questions Generated!',
        description: `We've prepared some questions for your ${values.jobRole} interview.`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to generate questions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interview Preparation</h1>
        <p className="text-muted-foreground">Get AI-generated questions to ace your next interview.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Interview Details</CardTitle>
            <CardDescription>Tell us about your upcoming interview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="jobRole" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="timeLeft" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Until Interview</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time frame" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3 days">3 Days</SelectItem>
                        <SelectItem value="1 week">1 Week</SelectItem>
                        <SelectItem value="2 weeks">2 Weeks</SelectItem>
                        <SelectItem value="1 month">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />}
                  Generate Questions
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
            <Card className="min-h-[30rem]">
                <CardHeader>
                    <CardTitle>Generated Questions</CardTitle>
                    <CardDescription>Practice these questions to get ready.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Generating insightful questions...</p>
                      </div>
                    ) : questions.length > 0 ? (
                        <ul className="space-y-4">
                            {questions.map((q, i) => (
                                <li key={i} className="flex items-start gap-4">
                                  <Lightbulb className="size-5 mt-1 text-accent shrink-0" />
                                  <p className="text-sm">{q}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <p className="text-muted-foreground">Your interview questions will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
