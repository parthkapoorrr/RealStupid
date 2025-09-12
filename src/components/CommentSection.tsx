
'use client';

import { useOptimistic, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Comment as CommentType } from '@/lib/types';
import Comment from './Comment';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { createComment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface CommentSectionProps {
  postId: string;
  initialComments: CommentType[];
}

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.'),
});

export default function CommentSection({
  postId,
  initialComments,
}: CommentSectionProps) {
  const { effectiveUser } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [optimisticComments, addOptimisticComment] = useOptimistic<CommentType[], CommentType>(
    initialComments,
    (state, newComment) => [newComment, ...state]
  );
  
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = async (data: z.infer<typeof commentSchema>) => {
    if (!effectiveUser) return;
    
    const newComment: CommentType = {
      id: `optimistic-${Date.now()}`,
      postId,
      author: {
        name: effectiveUser.displayName || 'Anonymous',
        avatarUrl: effectiveUser.photoURL || undefined,
      },
      content: data.content,
      createdAt: 'Just now',
      upvotes: 1,
      downvotes: 0,
    };
    
    addOptimisticComment(newComment);
    form.reset();

    const formData = new FormData();
    formData.append('content', data.content);
    formData.append('userId', effectiveUser.uid);
    formData.append('postId', postId);
    
    try {
      await createComment(formData);
    } catch (error) {
      console.error('Failed to post comment', error);
      toast({
        variant: 'destructive',
        title: 'Comment Failed',
        description: 'Your comment could not be saved. Please try again.',
      });
      // Here you would ideally revert the optimistic update
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          {effectiveUser ? (
            <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm">Comment as <span className="font-semibold text-primary">{effectiveUser.displayName}</span></p>
              <Textarea
                {...form.register('content')}
                placeholder="What are your thoughts?"
                className="min-h-[100px]"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.content.message}
                </p>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary text-primary-foreground font-bold">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Comment
                </Button>
              </div>
            </form>
          ) : (
            <p className='text-center text-muted-foreground'>Please log in to comment.</p>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {optimisticComments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
