import { z } from "/opt/nodejs/node_modules/zod";
import { HeadersProps } from "/opt/nodejs/types/common.types";
import { dbStoreValidator } from "/opt/nodejs/validators/database.validator";
import { storeValidator } from "/opt/nodejs/validators/store.validator";
import { channelsAndStoresValidator } from "/opt/nodejs/validators/store.validator";

export type Store = z.infer<typeof storeValidator>;
export type ChannelsAndStores = z.infer<typeof channelsAndStoresValidator>;

export type DBStore = z.infer<typeof dbStoreValidator>;

export interface CreateStoresProps {
  body: ChannelsAndStores;
  headers: HeadersProps;
}
