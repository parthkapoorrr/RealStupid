'use client';

import { useState } from 'react';
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
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentType[]>(initialComments);
  
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  const onSubmit = (data: z.infer<typeof commentSchema>) => {
    if (!user) return;

    const newComment: CommentType = {
      id: `c-${Date.now()}`,
      postId,
      author: {
        name: user.displayName || 'Anonymous',
        avatarUrl: user.photoURL || undefined,
      },
      content: data.content,
      createdAt: 'Just now',
      upvotes: 1,
      downvotes: 0,
    };
    setComments([newComment, ...comments]);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          {user ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <p className="text-sm">Comment as <span className="font-semibold text-primary">{user.displayName}</span></p>
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
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
