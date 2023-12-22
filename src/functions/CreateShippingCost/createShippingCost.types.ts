import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { dbShippingCostValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";

export type DBShippingCost = z.infer<typeof dbShippingCostValidator>;

export interface CreateShippingCostProps {
  shippingCost: number;
  deliveryId: number;
  storeChannels: string[];
  storeId: string;
  accountId: string;
  vendorId: string;
  oldShippingCostId: string | null;
}
