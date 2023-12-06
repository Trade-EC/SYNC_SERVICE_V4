export interface SyncRequest {
  type: "PRODUCTS" | "LIST" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  hash: string;
  createdAt?: string;
  s3Path?: string;
  metadata: SyncRequestMetadata;
}

export interface SyncRequestMetadata {
  channelId?: string;
  storesId?: string;
  listId?: string;
}
