import { createOrUpdateShippingCost } from "./createShippingCost.repository";
import { findShippingCost } from "./createShippingCost.repository";
import { shippingCostTransformer } from "./createShippingCost.transform";
import { CreateShippingCostProps } from "./createShippingCost.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { dbShippingCostValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";

export const syncShippingCostService = async (
  props: CreateShippingCostProps
) => {
  logger.info("SHIPPING COST: TRANSFORM");
  const shippingCost = shippingCostTransformer(props);
  const shippingCostPayload = dbShippingCostValidator.parse(shippingCost);
  const { oldShippingCostId, storeId, vendorId: onlyVendorId } = props;
  const { shippingCostId, account, vendor, additionalServices } =
    shippingCostPayload;
  const { accountId } = account;
  const { id: vendorId } = vendor;
  const dbShippingCost = await findShippingCost(
    shippingCostId,
    vendorId,
    accountId
  );

  if (oldShippingCostId && shippingCostId !== oldShippingCostId) {
    const dbShippingCostOld = await findShippingCost(
      oldShippingCostId,
      vendorId,
      accountId
    );

    if (dbShippingCostOld) {
      dbShippingCostOld.vendorIdStoreIdChannelId =
        dbShippingCostOld.vendorIdStoreIdChannelId.filter(
          id => !id.startsWith(`${onlyVendorId}.${storeId}`)
        );
      if (additionalServices && dbShippingCostOld.additionalServices) {
        dbShippingCostOld.additionalServices = [
          ...dbShippingCostOld.additionalServices,
          ...additionalServices
        ];
      } else {
        dbShippingCostOld.additionalServices = additionalServices;
      }
      await createOrUpdateShippingCost(dbShippingCostOld);
    }
  }

  if (!dbShippingCost) {
    logger.info("SHIPPING COST: CREATE");
    await createOrUpdateShippingCost(shippingCostPayload);
    return;
  }

  const ids = [
    ...dbShippingCost.vendorIdStoreIdChannelId,
    ...shippingCostPayload.vendorIdStoreIdChannelId
  ];
  const newShippingCost = new Set(ids);
  const newShippingCostArray = Array.from(newShippingCost);
  logger.info("SHIPPING COST: MERGE IDS");
  shippingCostPayload.vendorIdStoreIdChannelId = newShippingCostArray;

  logger.info("SHIPPING COST: CREATE");
  await createOrUpdateShippingCost(shippingCostPayload);

  return;
};
