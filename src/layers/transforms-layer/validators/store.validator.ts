import { transformKFCStores } from "../transformations/kfc/stores.transform";
import { kfcAccounts } from "../utils/accounts.utils";
import { kfcChannelsAndStoresValidatorMerge } from "./kfc/kfc-store.validator";

import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export const validateStores = (channelsAndStores: any, accountId: string) => {
  let channelsAndStoresTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      const kfcValidatedPayload =
        kfcChannelsAndStoresValidatorMerge.parse(channelsAndStores);

      channelsAndStoresTransformed = transformKFCStores(kfcValidatedPayload);
      break;
    default:
      channelsAndStoresTransformed = channelsAndStores;
  }

  const validatedPayload = channelsAndStoresValidator.parse(
    channelsAndStoresTransformed
  );

  return validatedPayload;
};
