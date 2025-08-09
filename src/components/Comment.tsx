import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import VoteButtons from './VoteButtons';
import type { Comment as CommentType } from '@/lib/types';
import { Card } from './ui/card';

interface CommentProps {
  comment: CommentType;
}

export default function Comment({ comment }: CommentProps) {
    const getInitials = (name: string | null) => {
        if (!name) return 'A';
        const names = name.split(' ');
        return names.map((n) => n[0]).join('').substring(0,2).toUpperCase();
    };

  return (
    <Card className="flex p-3 bg-card/50 rounded-lg">
      <div className="flex flex-col items-center mr-4">
         <Avatar className="h-8 w-8 mb-2">
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
            <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
        </Avatar>
        <div className="w-px flex-grow bg-border"></div>
      </div>
      <div className="flex-1">
        <div className="flex items-center text-sm mb-1">
          <span className="font-semibold text-foreground">{comment.author.name}</span>
          <span className="text-muted-foreground mx-2">•</span>
          <span className="text-muted-foreground">{comment.createdAt}</span>
        </div>
        <p className="text-foreground/90">{comment.content}</p>
        <div className="mt-2">
            <VoteButtons upvotes={comment.upvotes} downvotes={comment.downvotes} />
        </div>
      </div>
    </Card>
  );
}
