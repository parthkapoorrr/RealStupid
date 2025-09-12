import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  serial,
  uniqueIndex,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

export const users = pgTable(
  'users',
  {
    id: varchar('id', { length: 191 }).primaryKey(), // Firebase UID
    displayName: text('display_name'),
    email: text('email').notNull(),
    photoURL: text('photo_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex('email_idx').on(table.email),
    };
  }
);

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  content: text('content'),
  link: text('link'),
  userId: varchar('user_id', { length: 191 })
    .notNull()
    .references(() => users.id),
  community: varchar('community', { length: 128 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
  mode: varchar('mode', { length: 10 }).default('real').notNull(), // 'real' or 'stupid'
});

export const postsRelations = relations(posts, ({ one, many }) => ({
    user: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
    votes: many(postVotes),
}));

export const voteTypeEnum = pgEnum('vote_type', ['up', 'down']);

export const postVotes = pgTable('post_votes', {
    userId: varchar('user_id', {length: 191}).notNull().references(() => users.id, { onDelete: 'cascade' }),
    postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    voteType: voteTypeEnum('vote_type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.postId] }),
    }
});

export const postVotesRelations = relations(postVotes, ({ one }) => ({
    post: one(posts, {
        fields: [postVotes.postId],
        references: [posts.id],
    }),
    user: one(users, {
        fields: [postVotes.userId],
        references: [users.id],
    })
}));


export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  userId: varchar('user_id', { length: 191 })
    .notNull()
    .references(() => users.id),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;

export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export type Post = z.infer<typeof selectPostSchema>;

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);
export type Comment = z.infer<typeof selectCommentSchema>;