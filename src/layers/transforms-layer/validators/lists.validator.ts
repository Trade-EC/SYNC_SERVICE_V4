import { transformHorneroLists } from "../transformations/hornero/lists.transform";
import { transformKFCList } from "../transformations/kfc/lists.transform";
import { horneroAccounts, kfcAccounts } from "../utils/accounts.utils";
import { horneroListsValidatorMerge } from "./hornero/hornero-lists.validator";
import { kfcListsValidatorMerge } from "./kfc/kfc-lists.validator";

import { listsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export const validateLists = (list: any, accountId: string) => {
  let listTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      const kfcValidatedPayload = kfcListsValidatorMerge.parse(list);
      listTransformed = transformKFCList(kfcValidatedPayload);
      break;
    case horneroAccounts.includes(accountId):
      const horneroValidatedPayload = horneroListsValidatorMerge.parse(list);
      listTransformed = transformHorneroLists(horneroValidatedPayload);
      break;
    default:
      listTransformed = list;
  }

  const validatedPayload = listsValidator.parse(listTransformed);

  return validatedPayload;
};
