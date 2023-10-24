import { Context, SQSEvent } from "aws-lambda";

import { syncStoresService } from "./createStores.service";
import { CreateStoresProps } from "./createStores.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export async function lambdaHandler(event: SQSEvent, context: Context) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { Records } = event;
    const [record] = Records;
    logger.info("creating stores", { record });
    const { body: bodyRecord } = record ?? {};
    const props: CreateStoresProps = JSON.parse(bodyRecord ?? "");
    const { body, headers } = props;
    const { accountId } = headers;
    const response = await syncStoresService(body, accountId);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (error) {
    logger.error("creating stores error", { error });
    return error;
  }
}
