import { transformKFCProducts } from "../transformations/kfc/products.transform";
import { kfcAccounts } from "../utils/accounts.utils";
import { kfcProductsValidator } from "./kfc/kfc-lists.validator";

import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export const validateProducts = (products: any, accountId: string) => {
  let productsTransformed;
  switch (true) {
    case kfcAccounts.includes(accountId):
      const kfcValidatedPayload = kfcProductsValidator.parse(products);
      productsTransformed = transformKFCProducts(kfcValidatedPayload);
      break;
    default:
      productsTransformed = products;
  }

  const validatedPayload = productsValidator.parse(productsTransformed);

  return validatedPayload;
};
