
'use client';

import { useOptimistic, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { updateVote } from '@/app/actions';

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
  postId: string;
  upvotes: number;
  downvotes: number;
  direction?: 'row' | 'col';
  mode?: 'real' | 'stupid';
}

export default function VoteButtons({
  postId,
  upvotes,
  downvotes,
  direction = 'row',
  mode = 'real',
}: VoteButtonsProps) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);

  const [optimisticState, setOptimisticState] = useOptimistic(
    { upvotes, downvotes },
    (state, action: { voteType: 'up' | 'down' | 'unvote', previousVote: 'up' | 'down' | null }) => {
        if (action.voteType === 'up') {
            return {
                upvotes: state.upvotes + 1,
                downvotes: action.previousVote === 'down' ? Math.max(0, state.downvotes -1) : state.downvotes
            }
        }
        if (action.voteType === 'down') {
            return {
                upvotes: action.previousVote === 'up' ? Math.max(0, state.upvotes - 1) : state.upvotes,
                downvotes: state.downvotes + 1,
            }
        }
        if (action.voteType === 'unvote') {
             return {
                upvotes: action.previousVote === 'up' ? Math.max(0, state.upvotes - 1) : state.upvotes,
                downvotes: action.previousVote === 'down' ? Math.max(0, state.downvotes -1) : state.downvotes
            }
        }

        return state;
    }
  );
  
  const score = optimisticState.upvotes - optimisticState.downvotes;

  const handleVote = async (newVote: 'up' | 'down') => {
    const previousVote = vote;
    
    if (newVote === vote) {
      // Unvoting
      setVote(null);
      // We don't call the DB for unvoting in this simple implementation
    } else {
      // New vote or changing vote
      setVote(newVote);
      setOptimisticState({ voteType: newVote, previousVote });
      
      const postIdNum = parseInt(postId.replace('stupid-', ''), 10);
      if (!isNaN(postIdNum)) {
        await updateVote(postIdNum, newVote);
      }
    }
  };

  const upvoteText = mode === 'real' ? 'real' : 'stupid';
  const downvoteText = mode === 'real' ? 'stupid' : 'real';

  const upvoteClasses = {
    'text-primary': mode === 'real' && vote === 'up',
    'text-search-ring': mode === 'stupid' && vote === 'up',
  };

  const downvoteClasses = {
    'text-destructive': mode === 'real' && vote === 'down',
    'text-primary': mode === 'stupid' && vote === 'down',
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
        className={cn('h-auto p-1 text-foreground/80 hover:bg-transparent', upvoteClasses)}
        onClick={() => handleVote('up')}
        aria-label="Upvote"
      >
        <div className="flex flex-col items-center p-1 border border-transparent rounded-sm">
            <span className={cn("text-xs font-thin -mb-1", upvoteClasses)}>{upvoteText}</span>
            <UpArrow className={cn('w-9 h-9 text-foreground/60', upvoteClasses)} />
        </div>
      </Button>
      <span className="text-sm font-bold min-w-[2ch] text-center">{score}</span>
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-auto p-1 text-foreground/80 hover:bg-transparent', downvoteClasses)}
        onClick={() => handleVote('down')}
        aria-label="Downvote"
      >
        <div className="flex flex-col items-center p-1 border border-transparent rounded-sm">
            <DownArrow className={cn('w-9 h-9 text-foreground/60', downvoteClasses)} />
            <span className={cn("text-xs font-thin -mt-1", downvoteClasses)}>{downvoteText}</span>
        </div>
      </Button>
    </div>
  );
}
