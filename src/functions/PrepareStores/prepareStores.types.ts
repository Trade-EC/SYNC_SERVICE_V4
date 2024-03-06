import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { VendorChannels } from "/opt/nodejs/sync-service-layer/types/vendor.types";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;

export interface PrepareStoresPayload {
  channelsAndStores: ChannelsAndStores;
  accountId: string;
  storeHash: string;
  vendorChannels: VendorChannels;
  requestId: string;
  syncAll?: boolean;
}
