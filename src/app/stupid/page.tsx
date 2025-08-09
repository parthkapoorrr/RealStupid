'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Bot } from 'lucide-react';
import { askStupidBot } from '@/ai/flows/stupid-bot';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
       <CardHeader className="text-center p-4">
        <CardTitle className="text-3xl font-bold font-headline text-search-ring">stupidGPT</CardTitle>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-muted-foreground">Ask me anything. I'll try my best to be stupid.</div>
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
                'rounded-lg p-3 max-w-sm',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'
              )}
            >
              <p className="text-sm">{message.content}</p>
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
            placeholder="Ask the stupid bot a question..."
            className="flex-1 resize-none"
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
  );
}
