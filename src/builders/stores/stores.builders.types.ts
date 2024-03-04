import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { channelValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;
export type Store = z.infer<typeof storeValidator>;
export type Channel = z.infer<typeof channelValidator>;
