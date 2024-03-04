import { transformKFCStores } from "../transformations/kfc/stores.transform";
import { transformSCStores } from "../transformations/sushicorp/stores.transform";
import { kfcAccounts, sushicorpAccounts } from "../utils/accounts.utils";
import { kfcChannelsAndStoresValidatorMerge } from "./kfc/kfc-store.validator";
import { sCChannelsAndStoresValidatorMerge } from "./sushicorp/sushicorp-store.validator";

import { channelsAndStoresValidator } from "/opt/nodejs/sync-service-layer/validators/store.validator";

export const validateStores = (channelsAndStores: any, accountId: string) => {
  let channelsAndStoresTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      const kfcValidatedPayload =
        kfcChannelsAndStoresValidatorMerge.parse(channelsAndStores);

      channelsAndStoresTransformed = transformKFCStores(kfcValidatedPayload);
      break;
    case sushicorpAccounts.includes(accountId):
      const sushicorpValidatedPayload =
        sCChannelsAndStoresValidatorMerge.parse(channelsAndStores);
      channelsAndStoresTransformed = transformSCStores(
        sushicorpValidatedPayload
      );
      break;
    default:
      channelsAndStoresTransformed = channelsAndStores;
  }

  const validatedPayload = channelsAndStoresValidator.parse(
    channelsAndStoresTransformed
  );

  return validatedPayload;
};
