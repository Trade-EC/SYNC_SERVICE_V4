import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { queueEventsValidator } from "./fetchQueueEvents.validator";

const mapQueues = (queue: string) => {
  switch (queue) {
    case "stores":
      return process.env.SYNC_STORES_SQS_URL;
    case "stores-dlq":
      return process.env.SYNC_STORES_DLQ_URL;
    case "products":
      return process.env.SYNC_PRODUCT_SQS_URL;
    case "products-dlq":
      return process.env.SYNC_PRODUCT_DLQ_URL;
    case "shippingCost":
      return process.env.SYNC_SHIPPING_COST_SQS_URL;
    case "shippingCost-dlq":
      return process.env.SYNC_SHIPPING_COST_DLQ_URL;
    case "images":
      return process.env.SYNC_IMAGES_SQS_URL;
    case "images-dlq":
      return process.env.SYNC_IMAGES_DLQ_URL;
    case "publish":
      return process.env.SYNC_PUBLISH_SQS_URL;
    case "publish-dlq":
      return process.env.SYNC_PUBLISH_DLQ_URL;
    default:
      throw new Error("Queue not found");
  }
};

/**
 *
 * @param event
 * @description Fetch queue events
 * @returns {Promise<APIGatewayProxyResult>}
 */
export const fetchQueueEvents = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { queryStringParameters } = event;

  const { queue } = queueEventsValidator.parse(queryStringParameters);
  const queueUrl = mapQueues(queue);

  const list = await sqsClient.receiveMessage({
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
    AttributeNames: ["All"],
    MessageAttributeNames: ["All"]
  });

  return {
    statusCode: 200,
    body: JSON.stringify(list)
  };
};
