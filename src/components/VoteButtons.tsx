'use client';

import { useState } from 'react';
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
        size="sm"
        className={cn('font-bold', vote === 'up' ? 'text-primary' : 'text-foreground/80 hover:text-primary')}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        real
      </Button>
      <span className="text-sm font-bold min-w-[2ch] text-center">{score}</span>
      <Button
        variant="ghost"
        size="sm"
        className={cn('font-bold', vote === 'down' ? 'text-search-ring' : 'text-foreground/80 hover:text-search-ring')}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        stupid
      </Button>
    </div>
  );
}
