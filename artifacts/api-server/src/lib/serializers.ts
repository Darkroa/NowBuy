import type { Product, Order } from "@workspace/db";

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    currency: p.currency,
    imageUrl: p.imageUrl,
    images: (p.images ?? []) as string[],
    colors: (p.colors ?? []) as string[],
    productType: p.productType ?? "",
    rating: p.rating,
    stock: p.stock,
    sellerName: p.sellerName,
    tags: (p.tags ?? []) as string[],
  };
}

export function serializeOrder(o: Order) {
  return {
    id: o.id,
    status: o.status,
    total: o.total,
    currency: o.currency,
    trackingCode: o.trackingCode,
    shippingAddress: o.shippingAddress,
    placedBy: o.placedBy,
    createdAt: o.createdAt.toISOString(),
    items: o.items,
  };
}
