import { SendMessageBatchRequestEntry } from "@aws-sdk/client-sqs";
import dayjs from "dayjs";
import { chunk, sortBy } from "lodash";

import { sqsClient } from "../configs/config";
import CONSTANTS from "../configs/constants";
import { DbProduct } from "../types/products.types";

const { SQS_MAX_BATCH_SIZE } = CONSTANTS.GENERAL;
/**
 * @description Check if value is undefined
 * @param value
 * @returns {boolean}
 */
export const isUndefined = (value: any) => typeof value === "undefined";

/**
 * @description Normalize product type
 * @param productType
 * @returns string
 */
export const normalizeProductType = (productType: DbProduct["type"]) => {
  switch (productType) {
    case "COMPLEMENTO":
      return "COMPLEMENT";
    case "MODIFICADOR":
      return "MODIFIER";
    case "PRODUCTO":
      return "PRODUCT";
    default:
      return productType;
  }
};

/**
 * @description Chunk entries to SQS max batch size and send them
 * @param entries
 * @returns Promise<PromiseResult<SendMessageBatchResult, AWSError>[]>
 */
export const sqsChunkEntries = async (
  entries: SendMessageBatchRequestEntry[]
) => {
  if (!entries.length) return Promise.resolve([]);
  const chunks = chunk(entries, SQS_MAX_BATCH_SIZE);

  const promises = chunks.map(async chunk => {
    return sqsClient.sendMessageBatch({
      Entries: chunk,
      QueueUrl: process.env.SYNC_PRODUCT_SQS_URL ?? ""
    });
  });

  return await Promise.all(promises);
};

/**
 * @description Sort object by keys
 * @param {T} obj
 * @returns {T}
 */
export const sortObjectByKeys = <T extends Record<string, any>>(obj: T) => {
  const sortedObj = {} as any;
  const sortedKeys = sortBy(Object.keys(obj));
  sortedKeys.forEach(key => {
    sortedObj[key] = obj[key];
  });
  return sortedObj as T;
};

export const generateSyncS3Path = (
  accountId: string,
  vendorId: string,
  type: "LISTS" | "CHANNELS_STORES" | "PRODUCTS"
) => {
  const base = `requests/${accountId}/${vendorId}`;
  switch (type) {
    case "LISTS":
      return base + `/lists/${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.json`;
    case "CHANNELS_STORES":
      return (
        base + `/channels_stores/${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.json`
      );
    case "PRODUCTS":
      return base + `/products/${dayjs().format("YYYY-MM-DD-HH:mm:ss")}.json`;
  }
};
