import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { HeadersProps } from "/opt/nodejs/sync-service-layer/types/common.types";
import { dbStoreValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";
import { storeValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export type Store = z.infer<typeof storeValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;

export type DBStore = z.infer<typeof dbStoreValidator>;

export interface CreateStoresProps {
  body: ChannelsAndStores;
  headers: HeadersProps;
}
