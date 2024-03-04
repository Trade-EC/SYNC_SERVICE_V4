import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { queuesBodyValidator } from "./modifyQueues.validator";

const mapQueues = (queue: string, url = false) => {
  const prefix = url ? "URL" : "ARN";
  switch (queue) {
    case "stores":
      return process.env[`SYNC_STORES_SQS_${prefix}`];
    case "stores-dlq":
      return process.env[`SYNC_STORES_DLQ_${prefix}`];
    case "products":
      return process.env[`SYNC_PRODUCT_SQS_${prefix}`];
    case "products-dlq":
      return process.env[`SYNC_PRODUCT_DLQ_${prefix}`];
    case "shippingCost":
      return process.env[`SYNC_SHIPPING_COST_SQS_${prefix}`];
    case "shippingCost-dlq":
      return process.env[`SYNC_SHIPPING_COST_DLQ_${prefix}`];
    case "images":
      return process.env[`SYNC_IMAGES_SQS_${prefix}`];
    case "images-dlq":
      return process.env[`SYNC_IMAGES_DLQ_${prefix}`];
    case "publish":
      return process.env[`SYNC_PUBLISH_SQS_${prefix}`];
    case "publish-dlq":
      return process.env[`SYNC_PUBLISH_DLQ_${prefix}`];
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
export const modifyQueuesService = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { body } = event;
  const parsedBody = JSON.parse(body ?? "{}");

  const { queue, action } = queuesBodyValidator.parse(parsedBody);
  const mainQueue = queue.split("-")[0];
  const queueArn = mapQueues(queue);
  const mainQueueArn = mapQueues(mainQueue);

  let response;
  switch (action) {
    case "purge":
      const queueUrl = mapQueues(queue, true);
      response = await sqsClient.purgeQueue({ QueueUrl: queueUrl });
      break;
    case "reInject":
      response = await sqsClient.startMessageMoveTask({
        SourceArn: queueArn,
        DestinationArn: mainQueueArn,
        MaxNumberOfMessagesPerSecond: 10
      });
      break;
    default:
      throw new Error("Action not found");
  }

  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
};
