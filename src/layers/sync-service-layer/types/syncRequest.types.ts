export interface SyncRequest {
  type: "PRODUCTS" | "LIST" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  channelId?: string;
  storesId?: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
  hash?: string;
}
