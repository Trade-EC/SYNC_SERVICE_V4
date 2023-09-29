import { TransformProductsProps } from "/opt/nodejs/types/lists.types";

export interface CreateProductsBody extends TransformProductsProps {
  listName: string;
  source: "LIST" | "PRODUCT";
}

export interface CreateProductProps {
  body: CreateProductsBody;
  vendorIdStoreIdChannelId: string[];
}
