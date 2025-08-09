
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const UpArrow = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
        <path d="M12 2l10 10h-7v10h-6V12H2L12 2z" />
    </svg>
);

const DownArrow = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
        <path d="M12 22L2 12h7V2h6v10h7L12 22z" />
    </svg>
);


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
        className={cn('h-auto p-1 text-foreground/80 group', { 'text-primary': vote === 'up' })}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        <div className="flex flex-col items-center p-1 group-hover:bg-primary/10 rounded-sm">
            <span className="text-xs font-thin -mb-1 group-hover:text-foreground">real</span>
            <UpArrow className={cn('h-9 w-9', vote === 'up' ? 'text-primary' : 'text-foreground/60')} />
        </div>
      </Button>
      <span className="text-sm font-bold min-w-[2ch] text-center">{score}</span>
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-auto p-1 text-foreground/80 group', { 'text-search-ring': vote === 'down' })}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        <div className="flex flex-col items-center p-1 group-hover:bg-search-ring/10 rounded-sm">
            <DownArrow className={cn('h-9 w-9', vote === 'down' ? 'text-search-ring' : 'text-foreground/60')} />
            <span className="text-xs font-thin -mt-1 group-hover:text-foreground">stupid</span>
        </div>
      </Button>
    </div>
  );
}
