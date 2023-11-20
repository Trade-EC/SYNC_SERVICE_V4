import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { syncStoresService } from "./createStores.service";
import { CreateStoresProps } from "./createStores.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export async function lambdaHandler(
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> {
  context.callbackWaitsForEmptyEventLoop = false;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const { Records } = event;
  const [record] = Records;
  logger.info("STORE:", { record });
  try {
    const { body: bodyRecord } = record ?? {};
    const props: CreateStoresProps = JSON.parse(bodyRecord ?? "");
    const { body, headers } = props;
    const { accountId } = headers;
    await syncStoresService(body, accountId);
  } catch (error) {
    logger.error("STORE ERROR:", { error });
    response.batchItemFailures.push({ itemIdentifier: record.messageId });
  }
  return response;
}
