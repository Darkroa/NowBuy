import { pgTable, serial, text, integer, primaryKey } from "drizzle-orm/pg-core";

export const cartItemsTable = pgTable(
  "cart_items",
  {
    sessionId: text("session_id").notNull(),
    productId: integer("product_id").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.sessionId, t.productId] }),
  })
);

export type CartItemRow = typeof cartItemsTable.$inferSelect;
