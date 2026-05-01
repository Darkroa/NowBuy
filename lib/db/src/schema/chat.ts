import { pgTable, serial, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  productSuggestions: jsonb("product_suggestions").$type<number[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ChatMessageRow = typeof chatMessagesTable.$inferSelect;
