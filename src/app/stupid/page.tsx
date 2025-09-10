
'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Bot, MessageSquarePlus, Sparkles } from 'lucide-react';
import { askStupidBot } from '@/ai/flows/stupid-bot';
import { askHelpfulBot } from '@/ai/flows/helpful-bot';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import PostCard from '@/components/PostCard';
import { mockPosts } from '@/data/mock-data';
import type { Post } from '@/lib/types';
import Link from 'next/link';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"

const formSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt.'),
});

type Message = {
  role: 'user' | 'bot';
  content: string;
};

export default function StupidPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [helpfulAnswer, setHelpfulAnswer] = useState('');
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);
  const [stupidPosts, setStupidPosts] = useState<Post[]>([]);

  useEffect(() => {
    const generatedPosts: Post[] = mockPosts.map(post => ({
        ...post,
        id: `stupid-${post.id}`,
        community: `stupid/${post.community}`,
        title: `What if ${post.title.toLowerCase()}?`,
        content: `I was just thinking... ${post.content || ''}`,
        author: { name: `StupidUser${Math.floor(1000 + Math.random() * 9000)}` },
    }));
    setStupidPosts(generatedPosts);
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
            {stupidPosts.map((post) => (
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
            ))}
        </div>
    </div>
  );
}
