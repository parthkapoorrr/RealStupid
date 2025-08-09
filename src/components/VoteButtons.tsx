'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

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
        'flex items-center gap-1',
        direction === 'col' ? 'flex-col' : 'flex-row'
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-auto p-1 text-foreground/80 hover:text-primary', { 'text-primary': vote === 'up' })}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        <div className="flex flex-col items-center">
            <span className="text-xs font-thin -mb-1">real</span>
            <ArrowUp className={cn('h-5 w-5', { 'fill-primary': vote === 'up' })} />
        </div>
      </Button>
      <span className="text-sm font-bold min-w-[2ch] text-center">{score}</span>
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-auto p-1 text-foreground/80 hover:text-search-ring', { 'text-search-ring': vote === 'down' })}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        <div className="flex flex-col items-center">
            <ArrowDown className={cn('h-5 w-5', { 'fill-search-ring': vote === 'down' })} />
            <span className="text-xs font-thin -mt-1">stupid</span>
        </div>
      </Button>
    </div>
  );
}
