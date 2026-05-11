import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const landingPagesTable = pgTable("landing_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  productIds: jsonb("product_ids").$type<number[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type LandingPage = typeof landingPagesTable.$inferSelect;
