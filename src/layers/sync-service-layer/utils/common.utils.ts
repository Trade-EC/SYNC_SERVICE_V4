import { SendMessageBatchRequestEntry } from "@aws-sdk/client-sqs";
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
