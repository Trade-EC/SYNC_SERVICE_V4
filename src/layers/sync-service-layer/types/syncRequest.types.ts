export interface SyncRequest {
  type: "PRODUCTS" | "LISTS" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  hash: string;
  createdAt?: Date;
  s3Path?: string;
  metadata: SyncRequestMetadata;
}

export interface SyncRequestMetadata {
  channelId?: string;
  storesId?: string;
  listId?: string;
}
