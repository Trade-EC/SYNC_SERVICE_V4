import { TransformProductsProps } from "/opt/nodejs/sync-service-layer/types/lists.types";

export interface CreateProductsBody extends TransformProductsProps {
  listName: string;
  listId: string;
  source: "LIST" | "PRODUCTS";
  isLast: boolean;
  storeId: string;
}

export interface CreateProductProps {
  body: CreateProductsBody;
  vendorIdStoreIdChannelId: string[];
  listHash: string;
  syncAll: boolean;
}
