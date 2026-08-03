import { z } from 'zod';

// Esquemas basados en las respuestas reales de la API GraphQL de coppel.com


export const ProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string(),
  partNumber: z.string(),
  href: z.string().startsWith('/pdp/'),
  sku: z.string(),
  price: z.object({
    discountedPrice: z.number().nullable(),
    salesPrice: z.number().positive(),
    currency: z.literal('MXN'),
  }),
}).passthrough();

export const SearchResultsResponseSchema = z.object({
  data: z.object({
    getSearchResults: z.object({
      totalCount: z.number().int().nonnegative(),
      products: z.array(ProductSchema),
    }),
  }),
});

export const PriceEntrySchema = z.object({
  skuId: z.string(),
  offerAmount: z.number().nonnegative(),
  listAmount: z.number().positive(),
}).passthrough();

export const PriceResponseSchema = z.object({
  data: z.object({
    getPrice: z.array(PriceEntrySchema),
  }),
});

export const InventoryEntrySchema = z.object({
  productId: z.string(),
  availableQuantity: z.string(),
  inventoryStatus: z.boolean(),
}).passthrough();

export const InventoryResponseSchema = z.object({
  data: z.object({
    inventory: z.array(InventoryEntrySchema),
  }),
});

export const BasketProductItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  productName: z.string().min(1),
  listBasePrice: z.number().positive(),
}).passthrough();

export const AddItemToBasketResponseSchema = z.object({
  data: z.object({
    addItemToBasket: z.object({
      basketId: z.string().min(1),
      customerInfo: z.object({ customerId: z.string().min(1) }).passthrough(),
      productItems: z.array(BasketProductItemSchema),
    }),
  }),
});
