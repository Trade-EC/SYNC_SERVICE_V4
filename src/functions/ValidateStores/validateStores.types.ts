import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type Store = z.infer<typeof storeValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;
