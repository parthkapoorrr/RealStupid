'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { suggestCommunity } from '@/ai/flows/suggest-community';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { Loader2, Wand2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  community: z.string().min(2, 'Community name is required.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  content: z.string().optional(),
});

export default function SubmitForm() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      community: '',
      link: '',
      content: '',
    },
  });

  const postContent = form.watch('content');

  const handleSuggestCommunity = async () => {
    if (!postContent || postContent.trim().length < 20) {
      toast({
        variant: 'destructive',
        title: 'Content too short',
        description: 'Please write at least 20 characters to get suggestions.',
      });
      return;
    }
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const result = await suggestCommunity({ postContent });
      setSuggestions(result.suggestedCommunities);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: 'Could not get AI suggestions. Please try again.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: 'Post Submitted!',
      description: 'Your post has been successfully submitted (not really).',
    });
    form.reset();
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Please log in</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You need to be logged in to create a post.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="An interesting title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="community"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="e.g. webdev" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSuggestCommunity}
                  disabled={isSuggesting || !postContent}
                >
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Suggest
                </Button>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {suggestions.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => form.setValue('community', s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us more..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-primary text-primary-foreground font-bold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Post
        </Button>
      </form>
    </Form>
  );
}
