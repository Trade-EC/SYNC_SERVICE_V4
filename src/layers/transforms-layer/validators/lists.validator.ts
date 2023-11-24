import { transformKFCList } from "../transformations/kfc/lists.transform";
import { kfcAccounts } from "../utils/accounts.utils";

import { listsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export const validateLists = (list: any, accountId: string) => {
  let listTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      listTransformed = transformKFCList(list);
      break;
    default:
      listTransformed = list;
  }

  const validatedPayload = listsValidator.parse(listTransformed);

  return validatedPayload;
};
