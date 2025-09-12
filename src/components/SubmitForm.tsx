
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { createPost } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long.'),
  community: z.string().min(2, 'Community name is required.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  content: z.string().optional(),
  image: z.instanceof(File).optional(),
});

interface SubmitFormProps {
    mode?: 'real' | 'stupid';
}

export default function SubmitForm({ mode = 'real'}: SubmitFormProps) {
  const { toast } = useToast();
  const { effectiveUser, loading } = useAuth();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

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
  const imageFile = form.watch('image');
  const linkValue = form.watch('link');

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!effectiveUser) {
        toast({
            variant: 'destructive',
            title: 'Not logged in',
            description: 'You must be logged in to create a post.',
        });
        return;
    }

    const formData = new FormData();
    formData.append('userId', effectiveUser.uid);
    formData.append('title', values.title);
    formData.append('community', values.community);
    formData.append('mode', mode);
    if (values.link) formData.append('link', values.link);
    if (values.content) formData.append('content', values.content);
    if (values.image) {
      formData.append('image', values.image);
    }
    
    try {
      await createPost(formData);
      toast({
        title: 'Post Submitted!',
        description: 'Your post has been successfully created.',
      });
      router.push(`/${mode}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to create post', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not create your post. Please try again.',
      });
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!effectiveUser) {
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
        <div className='flex gap-4 items-end'>
            <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
                <FormItem className='flex-1'>
                <FormLabel>Link (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="https://example.com" {...field} disabled={!!imageFile} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="image"
                render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                    <FormLabel>Image (Optional)</FormLabel>
                    <FormControl>
                    <div className="relative">
                        <Button asChild variant="outline" className="w-full" disabled={!!linkValue}>
                            <label htmlFor="image-upload" className="cursor-pointer">
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {imageFile ? `${imageFile.name.substring(0, 15)}...` : 'Upload Image'}
                            </label>
                        </Button>
                        <Input 
                            id="image-upload"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                onChange(file);
                            }}
                            {...rest}
                            disabled={!!linkValue}
                        />
                    </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
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
              <FormDescription>
                You can use AI to suggest a community based on your post content.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={cn(mode === 'real' ? "bg-primary text-primary-foreground" : "bg-search-ring text-primary-foreground", "font-bold")}
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Post
        </Button>
      </form>
    </Form>
  );
}
