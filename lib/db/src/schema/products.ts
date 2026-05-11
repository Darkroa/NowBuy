import { pgTable, serial, text, integer, real, jsonb } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  originalPrice: real("original_price"),
  currency: text("currency").notNull().default("NGN"),
  imageUrl: text("image_url").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<string[]>().notNull().default([]),
  productType: text("product_type").notNull().default(""),
  rating: real("rating").notNull().default(4.5),
  stock: integer("stock").notNull().default(50),
  sellerName: text("seller_name").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
});

export type Product = typeof productsTable.$inferSelect;
