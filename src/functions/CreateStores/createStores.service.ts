import { APIGatewayProxyEvent } from "aws-lambda";

import { createOrUpdateStores } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { ChannelsAndStores } from "./createStores.types";
import { channelsAndStoresValidator } from "./createStores.validator";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { transformKFCStores } from "/opt/nodejs/transforms/kfcStore.transform";

export const syncStoresService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { Account: accountId } = headersValidator.parse(headers);
  let channelsAndStores;
  if (accountId === "1") {
    channelsAndStores = transformKFCStores(
      parsedBody,
      channelsAndStoresValidator
    ) as ChannelsAndStores;
  } else {
    channelsAndStores = channelsAndStoresValidator.parse(parsedBody);
  }
  const { stores, vendorId } = channelsAndStores;
  const syncStores = stores.map(store =>
    storeTransformer(store, accountId, vendorId)
  );
  const newStores = createOrUpdateStores(syncStores);
  return newStores;
};

// TODO: Hacer sincro de imagenes y verificar porque se crean dos categorías. Eliminar las entities que no tienen VendorIdStoreIdChannelId
