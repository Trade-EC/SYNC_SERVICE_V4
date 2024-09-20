import {
  saveProductsInHistory,
  saveStoresInHistory,
  saveVersion,
  updateStatusProducts,
  updateStatusStores
} from "./PublishSyncUpdateStatus.repository";
import { PublishSyncUpStatusServiceProps } from "./PublishSyncUpdateStatus.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishSyncUpStatusService = async (
  props: PublishSyncUpStatusServiceProps
) => {
  const { type } = props;
  logger.info("PUBLISH UPDATE STATUS: INIT");
  if (type === "STORES") {
    await updateStatusForStores(props);
  } else {
    await updateStatusForProducts(props);
  }

  logger.info("PUBLISH UPDATE STATUS: FINISHED");
};

export const updateStatusForProducts = async (
  props: PublishSyncUpStatusServiceProps
) => {
  const { vendorId, accountId, all = false, type, version } = props;
  logger.info("PUBLISH PRODUCTS: HISTORY", { type });
  const location = await saveProductsInHistory(
    vendorId,
    accountId,
    version,
    all
  );
  logger.info("PUBLISH PRODUCTS: UPDATING STATUS", { type });
  await updateStatusProducts(vendorId, accountId);
  await saveVersion(vendorId, accountId, version, type, location);
};

export const updateStatusForStores = async (
  props: PublishSyncUpStatusServiceProps
) => {
  const { vendorId, accountId, all = false, type, version } = props;
  logger.info("PUBLISH STORES: HISTORY", { type });
  await saveStoresInHistory(vendorId, accountId, version, all);
  logger.info("PUBLISH STORES: UPDATING STATUS", { type });
  await updateStatusStores(vendorId, accountId);
  await saveVersion(vendorId, accountId, version, type);
  await saveVersion(vendorId, accountId, version, "SHIPPING_COSTS");
};
