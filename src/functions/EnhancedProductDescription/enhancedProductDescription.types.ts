import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";

export type ProductForAi = Pick<
  DbProduct,
  "name" | "productId" | "description" | "categories"
>;

export interface ProductDescription {
  productId: DbProduct["productId"];
  aiDescription: string;
}
