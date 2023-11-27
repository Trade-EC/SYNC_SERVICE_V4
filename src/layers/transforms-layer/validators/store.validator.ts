import { transformKFCStores } from "../transformations/kfc/stores.transform";
import { kfcAccounts } from "../utils/accounts.utils";

import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export const validateStores = (channelsAndStores: any, accountId: string) => {
  let channelsAndStoresTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      // TODO: validador custom de KFC
      channelsAndStoresTransformed = transformKFCStores(channelsAndStores);
      break;
    default:
      channelsAndStoresTransformed = channelsAndStores;
  }

  const validatedPayload = channelsAndStoresValidator.parse(
    channelsAndStoresTransformed
  );

  return validatedPayload;
};
