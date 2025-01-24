export interface PublishRequest {
  accountId: string;
  vendorId: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  publishId: string;
  type: "PRODUCTS" | "LISTS" | "CHANNELS_STORES";
  createdAt?: Date;
  updatedAt?: Date;
}
