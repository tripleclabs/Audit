import { pgTable, serial, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

// audit log for file accesses; user/ip/repo/path/timestamp
export const audit = pgTable('audit', {
	id: serial('id').primaryKey(),
	user: text('user').notNull(),
	ip: text('ip').notNull(),
	repo: text('repo').notNull(),
	file_path: text('file_path').notNull(),
	accessed_at: timestamp('accessed_at').defaultNow().notNull()
});

// auditor notes: one note per user per file per repo
export const note = pgTable('note', {
	id: serial('id').primaryKey(),
	userId: text('user_id').notNull(),
	repoTag: text('repo_tag').notNull(),
	filePath: text('file_path').notNull(),
	content: text('content').notNull().default(''),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (t) => [
	unique().on(t.userId, t.repoTag, t.filePath)
]);

export *  from './auth.schema';
