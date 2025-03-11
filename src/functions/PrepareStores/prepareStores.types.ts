import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { StandardChannel } from "/opt/nodejs/sync-service-layer/types/channel.types";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;

export interface PrepareStoresPayload {
  channelsAndStores: ChannelsAndStores;
  accountId: string;
  storeHash: string;
  standardChannels: StandardChannel[];
  requestId: string;
  countryId: string;
  syncAll?: boolean;
  metadata?: any;
}
