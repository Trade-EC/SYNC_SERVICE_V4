import { APIGatewayProxyEvent } from "aws-lambda";

import { createOrUpdateStores } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { channelsAndStoresValidator } from "./createStores.validator";

import { headersValidator } from "/opt/nodejs/validators/common.validator";

export const syncStoresService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const channelsAndStores = channelsAndStoresValidator.parse(parsedBody);
  const { Account: accountId } = headersValidator.parse(headers);
  const { stores, vendorId } = channelsAndStores;
  const syncStores = stores.map(store =>
    storeTransformer(store, accountId, vendorId)
  );
  const newStores = createOrUpdateStores(syncStores);
  return newStores;
};
