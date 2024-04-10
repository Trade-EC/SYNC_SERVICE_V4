import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { StandardChannel } from "/opt/nodejs/sync-service-layer/types/channel.types";
import { dbStoreValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";
import { channelValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type Store = z.infer<typeof storeValidator>;
export type Channel = z.infer<typeof channelValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;

export type DBStore = z.infer<typeof dbStoreValidator>;

export interface CreateStoreBody {
  store: Store;
  channels: Channel[];
  accountId: string;
  vendorId: string;
  standardChannels: StandardChannel[];
  countryId: string;
}

export interface CreateStoreProps {
  body: CreateStoreBody;
  storeHash: string;
  syncAll: boolean;
  requestId: string;
}
