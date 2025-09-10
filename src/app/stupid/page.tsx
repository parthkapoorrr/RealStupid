
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Loader2, Bot, Sparkles } from 'lucide-react';
import { askStupidBot } from '@/ai/flows/stupid-bot';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { getPosts } from '../actions';

const formSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt.'),
});

export default function StupidPage() {
  const [helpfulAnswer, setHelpfulAnswer] = useState('');
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [stupidPosts, setStupidPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    async function loadAndProcessPosts() {
      setIsLoadingPosts(true);
      const realPosts = await getPosts() as Post[];
      const generatedPosts: Post[] = realPosts.map(post => ({
          ...post,
          id: `stupid-${post.id}`,
          community: `stupid/${post.community}`,
          title: `What if ${post.title.toLowerCase()}?`,
          content: `I was just thinking... ${post.content || ''}`,
          author: { name: `StupidUser${Math.floor(1000 + Math.random() * 9000)}` },
      }));
      setStupidPosts(generatedPosts);
      setIsLoadingPosts(false);
    }
    loadAndProcessPosts();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  const handleHelpfulBot = async (question: string) => {
    setIsHelpfulLoading(true);
    setHelpfulAnswer('');
    try {
        const response = await askStupidBot({ prompt: question });
        setHelpfulAnswer(response.reply);
    } catch (error) {
        console.error('Error getting helpful answer', error);
        setHelpfulAnswer('Sorry, my brain has short-circuited. Please try again.');
    } finally {
        setIsHelpfulLoading(false);
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline text-search-ring">Stupid Feed</h1>
            <div className="flex items-center gap-4">
              <Button asChild>
                  <Link href="/real">Go Real</Link>
              </Button>
              <Button asChild className="bg-search-ring hover:bg-search-ring/90 text-primary-foreground">
                  <Link href="/submit">Create Post</Link>
              </Button>
            </div>
        </div>
        <div className="space-y-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center pt-20">
                <Loader2 className="h-12 w-12 animate-spin text-search-ring" />
              </div>
            ) : stupidPosts.length > 0 ? (
              stupidPosts.map((post) => (
                  <div key={post.id}>
                      <PostCard post={post} mode="stupid" />
                      <div className="flex justify-end pr-2 -mt-12">
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-search-ring hover:text-search-ring/90" onClick={() => handleHelpfulBot(post.title)}>
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      Ask StupidGPT
                                  </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8 bg-primary/20 border border-primary">
                                          <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                                      </Avatar>
                                      StupidGPT's Answer
                                  </DialogTitle>
                                  <DialogDescription className="pt-4">
                                      <p className="font-semibold text-foreground">{post.title}</p>
                                  </DialogDescription>
                                  </DialogHeader>
                                  {isHelpfulLoading ? (
                                      <div className="flex items-center justify-center p-8">
                                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                      </div>
                                  ) : (
                                      <div className="prose prose-sm dark:prose-invert max-w-none">
                                          <p>{helpfulAnswer}</p>
                                      </div>
                                  )}
                              </DialogContent>
                          </Dialog>
                      </div>
                  </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground pt-10">No stupid questions to ask yet. Go create a real post first!</p>
            )}
        </div>
    </div>
  );
}
