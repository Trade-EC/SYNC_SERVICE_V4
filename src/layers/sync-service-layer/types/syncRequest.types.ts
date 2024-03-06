export interface SyncRequest {
  type: "PRODUCTS" | "LISTS" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  hash: string;
  createdAt?: Date;
  s3Path?: string;
  metadata: SyncRequestMetadata;
  requestId?: string;
}

export interface SyncRequestMetadata {
  channelId?: string;
  storesId?: string;
  listId?: string;
}

export type ErrorSyncRequest = Pick<
  SyncRequest,
  "type" | "accountId" | "vendorId" | "hash" | "metadata"
>;
