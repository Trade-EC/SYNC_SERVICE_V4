export interface SyncRequest {
  type: "PRODUCTS" | "LISTS" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  countryId: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  hash: string;
  createdAt?: Date;
  s3Path?: string;
  metadata: SyncRequestMetadata;
  requestId?: string;
  error?: string;
}

export interface SyncRequestMetadata {
  channelId?: string;
  storesId?: string;
  listId?: string;
  productIds?: string[];
}

export type ErrorSyncRequest = Pick<
  SyncRequest,
  "type" | "accountId" | "vendorId" | "hash" | "metadata"
>;
