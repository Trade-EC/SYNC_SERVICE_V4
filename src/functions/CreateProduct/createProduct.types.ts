import { TransformProductsProps } from "/opt/nodejs/sync-service-layer/types/lists.types";

export interface CreateProductsBody extends TransformProductsProps {
  listName: string;
  listId: string;
  source: "LISTS" | "PRODUCTS";
  storeId: string;
  syncType: "NORMAL";
  productId: string;
}

export interface CreateProductProps {
  body: CreateProductsBody | DeleteProductsBody;
  vendorIdStoreIdChannelId: string[];
  listHash: string;
  syncAll: boolean;
  requestId: string;
  metadata?: any;
}

export interface DeleteProductsBody {
  productId: string;
  channelId: string;
  accountId: string;
  vendorId: string;
  countryId: string;
  listId: string;
  storeId: string;
  source: "LISTS" | "PRODUCTS";
  syncType: "DELETE";
}
