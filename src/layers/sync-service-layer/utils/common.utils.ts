import { DbProduct } from "../types/products.types";

export const isUndefined = (value: any) => typeof value === "undefined";

export const normalizeProductType = (productType: DbProduct["type"]) => {
  switch (productType) {
    case "COMPLEMENTO":
      return "COMPLEMENT";
    case "MODIFICADOR":
      return "MODIFIER";
    case "PRODUCTO":
      return "PRODUCT";
    default:
      return productType;
  }
};
