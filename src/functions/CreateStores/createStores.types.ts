import { z } from "/opt/nodejs/node_modules/zod";

import { channelsAndStoresValidator } from "./createStores.validator";
import { storeValidator } from "./createStores.validator";

export type Store = z.infer<typeof storeValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;
