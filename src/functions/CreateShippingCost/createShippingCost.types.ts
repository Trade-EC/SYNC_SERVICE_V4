import { DeliveryServices } from "../CreateStores/createStores.types";

import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { ChannelMappings } from "/opt/nodejs/sync-service-layer/types/channel.types";
import { dbShippingCostValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";

export type DBShippingCost = z.infer<typeof dbShippingCostValidator>;

export interface CreateShippingCostProps {
  shippingCost: number;
  deliveryId: number;
  channelMappings: ChannelMappings[];
  storeId: string;
  accountId: string;
  vendorId: string;
  countryId: string;
  oldShippingCostId: string | null;
  additionalServices?: DeliveryServices[];
}
