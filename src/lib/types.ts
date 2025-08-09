export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Post {
  id: string;
  title: string;
  link?: string;
  content?: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  community: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
}

export interface Comment {
  id: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  postId: string;
  parentId?: string;
  replies?: Comment[];
}
