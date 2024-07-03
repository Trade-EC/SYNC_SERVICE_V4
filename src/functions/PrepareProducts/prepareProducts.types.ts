import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { TaxesInfo } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export type Lists = z.infer<typeof productsValidator>;

export interface PrepareProductsPayload {
  listInfo: Lists;
  accountId: string;
  listHash: string;
  channelId: string;
  source: "PRODUCTS" | "LISTS";
  requestId: string;
  countryId: string;
  vendorTaxes: TaxesInfo | undefined;
  syncAll?: boolean;
}
