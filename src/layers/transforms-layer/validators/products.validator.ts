import { transformKFCProducts } from "../transformations/kfc/products.transform";
import { kfcAccounts } from "../utils/accounts.utils";

import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export const validateProducts = (products: any, accountId: string) => {
  let productsTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      productsTransformed = transformKFCProducts(products);
      break;
    default:
      productsTransformed = products;
  }

  const validatedPayload = productsValidator.parse(productsTransformed);

  return validatedPayload;
};
