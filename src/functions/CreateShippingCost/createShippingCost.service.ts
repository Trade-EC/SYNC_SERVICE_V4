import { createOrUpdateShippingCost } from "./createShippingCost.repository";
import { findShippingCost } from "./createShippingCost.repository";
import { shippingCostTransformer } from "./createShippingCost.transform";
import { CreateShippingCostProps } from "./createShippingCost.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

export const syncShippingCostService = async (
  props: CreateShippingCostProps
) => {
  logger.info("SHIPPING COST: TRANSFORM");
  const shippingCost = shippingCostTransformer(props);
  const { oldShippingCostId, storeId } = props;
  const { shippingCostId, account, vendor } = shippingCost;
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

    dbShippingCostOld.vendorIdStoreIdChannelId =
      dbShippingCostOld.vendorIdStoreIdChannelId.filter(
        id => !id.startsWith(`${vendorId}.${storeId}`)
      );

    await createOrUpdateShippingCost(dbShippingCostOld);
  }

  if (!dbShippingCost) {
    logger.info("SHIPPING COST: CREATE");
    await createOrUpdateShippingCost(shippingCost);
    return;
  }

  const ids = [
    ...dbShippingCost.vendorIdStoreIdChannelId,
    ...shippingCost.vendorIdStoreIdChannelId
  ];
  const newShippingCost = new Set(ids);
  const newShippingCostArray = Array.from(newShippingCost);
  logger.info("SHIPPING COST: MERGE IDS");
  shippingCost.vendorIdStoreIdChannelId = newShippingCostArray;

  logger.info("SHIPPING COST: CREATE");
  await createOrUpdateShippingCost(shippingCost);

  return;
};
