import { Context } from "aws-lambda";

import { prepareStoreService } from "./prepareStores.service";
import { PrepareStoresPayload } from "./prepareStores.types";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";

/**
 *
 * @param event
 * @param context
 * @description Lambda handler
 * @returns {Promise<APIGatewayProxyResult>}
 */
const handler = async (event: PrepareStoresPayload, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let response;

  try {
    await prepareStoreService(event);
  } catch (e) {
    response = handleError(e);
    logger.error("error", { response });
    return response;
  }
};

export const lambdaHandler = middyWrapper(handler);
