
'use client';

import { useOptimistic, useTransition } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { updateVote } from '@/app/actions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  userVote: 'up' | 'down' | null;
  direction?: 'row' | 'col';
  mode?: 'real' | 'stupid';
}

export default function VoteButtons({
  postId,
  upvotes,
  downvotes,
  userVote,
  direction = 'row',
  mode = 'real',
}: VoteButtonsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [optimisticState, setOptimisticState] = useOptimistic(
    { upvotes, downvotes, userVote },
    (state, action: { voteType: 'up' | 'down' }) => {
        const { voteType } = action;
        const currentUserVote = state.userVote;

        if (voteType === currentUserVote) {
            // Unvoting
            return {
                upvotes: state.upvotes - (voteType === 'up' ? 1 : 0),
                downvotes: state.downvotes - (voteType === 'down' ? 1 : 0),
                userVote: null
            };
        } else if (currentUserVote) {
            // Changing vote
            return {
                upvotes: state.upvotes + (voteType === 'up' ? 1 : -1),
                downvotes: state.downvotes + (voteType === 'down' ? -1 : 1),
                userVote: voteType,
            };
        } else {
            // New vote
            return {
                upvotes: state.upvotes + (voteType === 'up' ? 1 : 0),
                downvotes: state.downvotes + (voteType === 'down' ? 1 : 0),
                userVote: voteType,
            };
        }
    }
  );
  
  const score = optimisticState.upvotes - optimisticState.downvotes;
  const currentVote = optimisticState.userVote;

  const handleVote = async (newVote: 'up' | 'down') => {
    if (!user) {
        toast({
            title: "Login Required",
            description: "You must be logged in to vote.",
            variant: "destructive",
        });
        return;
    }

    startTransition(() => {
        setOptimisticState({ voteType: newVote });
    });

    const postIdNum = parseInt(postId.replace('stupid-', ''), 10);
    if (!isNaN(postIdNum)) {
        try {
            await updateVote(postIdNum, newVote, user.uid);
        } catch (error) {
            toast({
                title: "Vote Failed",
                description: "Your vote could not be saved. Please try again.",
                variant: "destructive"
            })
            // NOTE: We are not reverting the optimistic state here for simplicity,
            // but in a real-world app, you'd want to handle this failure case.
        }
    }
  };

  const upvoteText = mode === 'real' ? 'real' : 'stupid';
  const downvoteText = mode === 'real' ? 'stupid' : 'real';

  const upvoteClasses = {
    'text-primary': mode === 'real' && currentVote === 'up',
    'text-search-ring': mode === 'stupid' && currentVote === 'up',
  };

  const downvoteClasses = {
    'text-destructive': mode === 'real' && currentVote === 'down',
    'text-primary': mode === 'stupid' && currentVote === 'down',
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
        disabled={isPending}
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
        disabled={isPending}
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

    