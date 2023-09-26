export interface SyncRequest {
  type: "PRODUCTS" | "LISTS" | "CHANNELS_STORES";
  accountId: string;
  vendorId: string;
  channelId?: string;
  storesId?: string;
  status: "PENDING" | "ERROR" | "SUCCESS";
}
