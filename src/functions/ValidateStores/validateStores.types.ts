import { z } from "/opt/nodejs/node_modules/zod";
import { storeValidator } from "/opt/nodejs/validators/requestStore.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/validators/requestStore.validator";

export type Store = z.infer<typeof storeValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;
