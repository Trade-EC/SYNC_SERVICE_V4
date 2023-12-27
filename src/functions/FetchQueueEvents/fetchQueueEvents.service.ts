import { APIGatewayProxyEvent } from "aws-lambda";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { queueEventsValidator } from "./fecthQueueEvents.validator";

const mapQueues = (queue: string) => {
  switch (queue) {
    case "stores":
      return process.env.SYNC_STORES_SQS_URL;
    case "products":
      return process.env.SYNC_PRODUCT_SQS_URL;
    case "shippingCost":
      return process.env.SYNC_SHIPPING_COST_SQS_URL;
    case "images":
      return process.env.SYNC_IMAGES_SQS_URL;
    case "publish":
      return process.env.SYNC_PUBLISH_SQS_URL;
    default:
      throw new Error("Queue not found");
  }
};

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const fetchQueueEvents = async (event: APIGatewayProxyEvent) => {
  const { queryStringParameters } = event;

  const { queue } = queueEventsValidator.parse(queryStringParameters);
  const queueUrl = mapQueues(queue);

  await sqsClient.listMessageMoveTasks({ SourceArn: queueUrl });

  return {
    statusCode: 200,
    body: "Hola Mundo"
  };
};
