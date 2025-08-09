'use client';

import { useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  upvotes: number;
  downvotes: number;
  direction?: 'row' | 'col';
}

export default function VoteButtons({
  upvotes,
  downvotes,
  direction = 'row',
}: VoteButtonsProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [score, setScore] = useState(upvotes - downvotes);

  const handleVote = (newVote: 'up' | 'down') => {
    if (newVote === vote) {
      // Unvoting
      setVote(null);
      setScore(score + (newVote === 'up' ? -1 : 1));
    } else {
      // New vote or changing vote
      let scoreChange = 0;
      if (vote === 'up') scoreChange = -1;
      if (vote === 'down') scoreChange = 1;

      scoreChange += (newVote === 'up' ? 1 : -1);
      
      setScore(score + scoreChange);
      setVote(newVote);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 bg-card-foreground/5 rounded-md p-1',
        direction === 'col' ? 'flex-col' : 'flex-row'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', vote === 'up' ? 'text-primary' : 'text-foreground/80 hover:text-primary')}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        <ArrowUp className={cn(vote === 'up' ? 'fill-current' : '')} />
      </Button>
      <span className="text-sm font-bold min-w-[2ch] text-center">{score}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-8 w-8', vote === 'down' ? 'text-destructive' : 'text-foreground/80 hover:text-destructive')}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        <ArrowDown className={cn(vote === 'down' ? 'fill-current' : '')} />
      </Button>
    </div>
  );
}
