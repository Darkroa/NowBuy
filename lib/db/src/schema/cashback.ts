import { pgTable, serial, text, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const cashbackCodesTable = pgTable("cashback_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  amount: real("amount").notNull(),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CashbackCode = typeof cashbackCodesTable.$inferSelect;
