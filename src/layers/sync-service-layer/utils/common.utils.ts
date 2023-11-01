import { SendMessageBatchRequestEntry } from "@aws-sdk/client-sqs";
import { chunk, sortBy } from "lodash";

import { sqsClient } from "../configs/config";
import CONSTANTS from "../configs/constants";
import { DbProduct } from "../types/products.types";

const { SQS_MAX_BATCH_SIZE } = CONSTANTS.GENERAL;

export const isUndefined = (value: any) => typeof value === "undefined";

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

export const sortObjectByKeys = <T extends Record<string, any>>(obj: T) => {
  const sortedObj = {} as any;
  const sortedKeys = sortBy(Object.keys(obj));
  sortedKeys.forEach(key => {
    sortedObj[key] = obj[key];
  });
  return sortedObj as T;
};
