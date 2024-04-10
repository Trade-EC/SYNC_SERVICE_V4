import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

import { findStore } from "./createStores.repository";
import { createOrUpdateStores } from "./createStores.repository";
import { verifyCompletedStore } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { CreateStoreProps } from "./createStores.types";
import { CreateShippingCostProps } from "../CreateShippingCost/createShippingCost.types";

import { sortObjectByKeys } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { SyncStoreRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { ChannelMappings } from "/opt/nodejs/sync-service-layer/types/channel.types";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create or update stores in database
 * @returns void
 */
export const syncStoresService = async (props: CreateStoreProps) => {
  const { body, storeHash, syncAll, requestId } = props;
  const { accountId, store, vendorId, channels, countryId } = body;
  const { standardChannels } = body;
  const { storeId, deliveryInfo, storeChannels } = store;
  const { deliveryId, shippingCost } = deliveryInfo ?? {};
  const dbStoreId = `${accountId}.${countryId}.${vendorId}.${storeId}`;
  const logKeys = { vendorId, accountId, storeId, requestId };
  logger.info("STORE: INIT", logKeys);
  const channelMappings = storeChannels
    .map(storeChannel => {
      const channelsInStores = channels.filter(
        channel => channel.channelId === storeChannel
      );
      const standardChannelInStore = standardChannels.map(standardChannel => {
        const foundChannel = channelsInStores?.find(channel => {
          const { channelReferenceName, ecommerceChannelId } = channel;
          const regex = channelReferenceName
            ? new RegExp(channelReferenceName, "i")
            : undefined;
          return (
            ecommerceChannelId?.toString() === standardChannel.channelId ||
            standardChannel.tags.some(tag => regex?.test(tag) ?? false)
          );
        });
        if (!foundChannel) return null;
        return {
          id: standardChannel.channelId,
          externalChannelId: foundChannel.channelId,
          name: standardChannel.name
        };
      });
      return standardChannelInStore.filter(channel => !!channel);
    })
    .flat()
    .filter(channel => !!channel) as ChannelMappings[];
  const storeDB = await findStore(dbStoreId);
  const { shippingCostId } = storeDB ?? {};
  const transformedStore = storeTransformer(
    store,
    accountId,
    vendorId,
    channelMappings,
    countryId
  );
  const orderedTransformStore = sortObjectByKeys(transformedStore);
  const syncStoreRequest: SyncStoreRecord = {
    accountId,
    status: "SUCCESS",
    vendorId,
    storeId: dbStoreId,
    requestId
  };
  if (deliveryId && typeof shippingCost !== "undefined") {
    const shippingPayload: CreateShippingCostProps = {
      accountId,
      deliveryId,
      shippingCost,
      channelMappings,
      storeId,
      vendorId,
      oldShippingCostId: shippingCostId,
      countryId
    };
    logger.info("STORE: SEND SHIPPING COST", { shippingPayload, ...logKeys });
    await sqsExtendedClient.sendMessage({
      QueueUrl: process.env.SYNC_SHIPPING_COST_SQS_URL ?? "",
      MessageBody: JSON.stringify(shippingPayload),
      MessageGroupId: `${accountId}-${countryId}-${vendorId}-${deliveryId}`
    });
  }
  if (!storeDB) {
    const hash = sha1(JSON.stringify(orderedTransformStore));
    const version = new Date().getTime();
    orderedTransformStore.hash = hash;
    orderedTransformStore.version = version;
    logger.info("STORE: CREATE", { store: orderedTransformStore, ...logKeys });
    await createOrUpdateStores(orderedTransformStore);
    logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED", logKeys);
    return;
  }

  const newHash = sha1(JSON.stringify(orderedTransformStore));
  const version = new Date().getTime();
  orderedTransformStore.hash = newHash;
  orderedTransformStore.version = version;
  const { hash } = storeDB;
  if (hash === newHash && !syncAll) {
    logger.info("STORE: NO CHANGES", logKeys);
    logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED", logKeys);
    return;
  }

  logger.info("STORE: UPDATE", { store: orderedTransformStore, ...logKeys });
  await createOrUpdateStores(orderedTransformStore);
  logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
  await verifyCompletedStore(syncStoreRequest, storeHash);
  logger.info("STORE: FINISHED", logKeys);
  return;
};
