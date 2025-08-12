
'use client';
import { useState } from 'react';
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

const stupidPosts: Post[] = mockPosts.map(post => ({
    ...post,
    id: `stupid-${post.id}`,
    community: `stupid/${post.community}`,
    title: `What if ${post.title.toLowerCase()}?`,
    content: `I was just thinking... ${post.content || ''}`,
    author: { name: `StupidUser${Math.floor(1000 + Math.random() * 9000)}` },
}));

export default function StupidPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [helpfulAnswer, setHelpfulAnswer] = useState('');
  const [isHelpfulLoading, setIsHelpfulLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: data.prompt };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();

    try {
      const response = await askStupidBot({ prompt: data.prompt });
      const botMessage: Message = { role: 'bot', content: response.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling stupid bot:', error);
      const errorMessage: Message = { role: 'bot', content: "I'm feeling a bit stupid right now, try again later." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHelpfulBot = async (question: string) => {
    setIsHelpfulLoading(true);
    setHelpfulAnswer('');
    try {
        const response = await askHelpfulBot({ prompt: question });
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
             <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="outline" className="border-search-ring text-search-ring hover:bg-search-ring/10 hover:text-search-ring">
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        {isChatOpen ? 'Close Chat' : 'Ask stupidGPT'}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                    <div className="fixed bottom-0 right-0 w-full max-w-md z-50">
                        <div className="flex flex-col h-[60vh] bg-background border-l border-t border-border rounded-tl-lg">
                            <CardHeader className="text-center p-4">
                                <CardTitle className="text-xl font-bold font-headline text-search-ring">stupidGPT</CardTitle>
                            </CardHeader>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center text-muted-foreground text-sm">Ask me anything. I'll try my best to be stupid.</div>
                                )}
                                {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : 'justify-start')}
                                >
                                    {message.role === 'bot' && (
                                    <Avatar className="h-8 w-8 bg-search-ring/20 border border-search-ring">
                                        <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5 text-search-ring" /></AvatarFallback>
                                    </Avatar>
                                    )}
                                    <div
                                    className={cn(
                                        'rounded-lg p-3 max-w-xs text-sm',
                                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
                                    )}
                                    >
                                     <p>{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                    )}
                                </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-start gap-4 justify-start">
                                        <Avatar className="h-8 w-8 bg-search-ring/20 border border-search-ring">
                                            <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5 text-search-ring" /></AvatarFallback>
                                        </Avatar>
                                        <div className="rounded-lg p-3 max-w-sm bg-card flex items-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-search-ring" />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border-t">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-4">
                                <Textarea
                                    {...form.register('prompt')}
                                    placeholder="Ask the stupid bot..."
                                    className="flex-1 resize-none text-sm"
                                    rows={1}
                                    onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        form.handleSubmit(onSubmit)();
                                    }
                                    }}
                                />
                                <Button type="submit" disabled={isLoading} size="icon" className="bg-search-ring hover:bg-search-ring/90">
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                                    }
                                </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
        <div className="space-y-4">
            {stupidPosts.map((post) => (
                <div key={post.id}>
                    <PostCard post={post} />
                    <div className="flex justify-end pr-2 -mt-12">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90" onClick={() => handleHelpfulBot(post.title)}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Ask RealGPT
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 bg-primary/20 border border-primary">
                                        <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                                    </Avatar>
                                    RealGPT's Answer
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
