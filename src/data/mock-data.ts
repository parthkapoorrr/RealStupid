import type { Post, Comment } from '@/lib/types';

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'I built a spaceship with CSS gradients',
    link: 'https://example.com/spaceship',
    author: { name: 'css_wizard' },
    community: 'webdev',
    createdAt: '4 hours ago',
    upvotes: 1337,
    downvotes: 42,
    commentsCount: 88,
  },
  {
    id: '2',
    title: 'The philosophical implications of "hot dog" vs "not hot dog"',
    content: 'In the realm of binary classification, the "hot dog" detector from Silicon Valley presents a fascinating case study. It forces us to confront the nature of identity, categorization, and the limits of algorithmic understanding. Is a hot dog defined by its ingredients, its form, or its cultural context? Discuss.',
    author: { name: 'deep_thinker' },
    community: 'philosophy',
    createdAt: '2 days ago',
    upvotes: 256,
    downvotes: 12,
    commentsCount: 64,
  },
  {
    id: '3',
    title: 'Found this weirdly shaped rock, looks like a cat',
    link: 'https://placehold.co/600x400.png',
    author: { name: 'rock_hound' },
    community: 'mildlyinteresting',
    createdAt: '1 day ago',
    upvotes: 5012,
    downvotes: 123,
    commentsCount: 345,
  },
];

export const mockComments: { [postId: string]: Comment[] } = {
  '1': [
    {
      id: 'c1-1',
      postId: '1',
      author: { name: 'pixel_pusher' },
      content: 'That\'s not a spaceship, that\'s a masterpiece!',
      createdAt: '3 hours ago',
      upvotes: 25,
      downvotes: 1,
    },
    {
      id: 'c1-2',
      postId: '1',
      author: { name: 'div_destroyer' },
      content: 'Can you share the source code? I\'d love to see how you made the thrusters glow.',
      createdAt: '2 hours ago',
      upvotes: 18,
      downvotes: 0,
    },
  ],
  '2': [
    {
        id: 'c2-1',
        postId: '2',
        author: { name: 'plato_fan' },
        content: 'This reminds me of the Ship of Theseus paradox. If you replace the sausage with a tofu-dog, is it still a hot dog?',
        createdAt: '1 day ago',
        upvotes: 42,
        downvotes: 2,
    },
    {
        id: 'c2-2',
        postId: '2',
        author: { name: 'jian_yang' },
        content: 'Not hot dog.',
        createdAt: '23 hours ago',
        upvotes: 150,
        downvotes: 0,
    }
  ],
  '3': [
      {
          id: 'c3-1',
          postId: '3',
          author: { name: 'cat_person' },
          content: 'It has ears and everything! That\'s amazing.',
          createdAt: '20 hours ago',
          upvotes: 77,
          downvotes: 3,
      }
  ]
};
