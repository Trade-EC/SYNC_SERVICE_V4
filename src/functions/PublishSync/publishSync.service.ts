import {
  fetchProducts,
  fetchStores,
  setDraftStatusForQuestionsParentsProducts,
  savePublishRequest
} from "./publishSync.repository";
import { PublishSyncServiceProps } from "./publishSync.types";

import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import { v4 as uuidv4 } from "/opt/nodejs/sync-service-layer/node_modules/uuid";

const NEW_PRODUCTS_SERVICE_URL = process.env.NEW_PRODUCTS_SERVICE_URL ?? "";

const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};

export const callPublishEP = async (
  vendorId: string,
  type: "STORES" | "PRODUCTS",
  publishId: string,
  version: number
) => {
  const url = `${NEW_PRODUCTS_SERVICE_URL}/api/v4/publish?publishId=${publishId}&version=${version}&vendorId=${vendorId}&type=${type.toLowerCase()}`;
  const response = await fetch(url, fetchOptions);
  const { status } = response;
  if (status > 399) {
    logger.error("PUBLISH: ERROR SYNCING", { status, type });
    throw new Error("Error syncing");
  }
};

export const publishStores = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  publishId: string
) => {
  logger.info("PUBLISH STORES: FETCHING DATA", { type: "STORES" });
  const stores = await fetchStores(vendorId, accountId, all);
  if (stores.length === 0) {
    return {
      key: "",
      message: "No stores to publish"
    };
  }
  await savePublishRequest(vendorId, accountId, "STORES", publishId);
  logger.info("PUBLISH STORES: SAVING IN S3", { type: "STORES" });
  logger.info("PUBLISH STORES: SYNCING", { type: "STORES" });
  await callPublishEP(vendorId, "STORES", publishId, version);
  await sendMessageToUpdateStatusSQS(
    vendorId,
    accountId,
    version,
    all,
    "STORES"
  );
};

export const publishProducts = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  publishId: string
) => {
  logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS" });
  if (!all) {
    logger.info("PUBLISH PRODUCTS: FETCHING DATA", { type: "PRODUCTS", all });
    await setDraftStatusForQuestionsParentsProducts(vendorId, accountId);
  }
  const rawProducts = await fetchProducts(vendorId, accountId, version, all);
  if (rawProducts.length === 0) {
    return {
      key: "",
      message: "No products to publish"
    };
  }
  console.log("Length of rawProducts", rawProducts.length);
  await savePublishRequest(vendorId, accountId, "PRODUCTS", publishId);

  logger.info("PUBLISH PRODUCTS: SYNCING", { type: "PRODUCTS" });
  await callPublishEP(vendorId, "PRODUCTS", publishId, version);
  await sendMessageToUpdateStatusSQS(
    vendorId,
    accountId,
    version,
    all,
    "PRODUCTS"
  );
};

export const sendMessageToUpdateStatusSQS = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean,
  type: "STORES" | "PRODUCTS"
) => {
  const messageBody = {
    vendorId,
    accountId,
    version,
    all,
    type,
    metadata: {
      lambda: "UpdateStatus"
    }
  };

  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.UPDATE_STATUS_SQS_URL ?? "",
    MessageBody: JSON.stringify(messageBody)
  });
};

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishSyncService = async (props: PublishSyncServiceProps) => {
  const { vendorId, accountId, rePublish, all = false } = props;
  logger.appendKeys({ vendorId, accountId });
  logger.info("PUBLISH: INIT");
  const version = new Date().getTime();
  const productsPublishId = uuidv4();
  const storesPublishId = uuidv4();
  if (rePublish) {
    await savePublishRequest(vendorId, accountId, "STORES", storesPublishId);
    await savePublishRequest(
      vendorId,
      accountId,
      "PRODUCTS",
      productsPublishId
    );
    logger.info("PUBLISH: REPUBLISH");
    await Promise.all([
      callPublishEP(vendorId, "STORES", storesPublishId, version),
      callPublishEP(vendorId, "PRODUCTS", productsPublishId, version)
    ]);
    logger.info("PUBLISH: FINISHED");
    return;
  }

  await Promise.all([
    publishStores(vendorId, accountId, version, all, storesPublishId),
    publishProducts(vendorId, accountId, version, all, productsPublishId)
  ]);

  logger.info("PUBLISH: FINISHED");
};
