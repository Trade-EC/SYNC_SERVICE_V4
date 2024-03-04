import { CreateShippingCostProps } from "./createShippingCost.types";
import { DBShippingCost } from "./createShippingCost.types";

export const shippingCostTransformer = (
  props: CreateShippingCostProps
): DBShippingCost => {
  const { shippingCost, deliveryId, storeChannels } = props;
  const { storeId, accountId, vendorId } = props;
  return {
    shippingCostId: `${accountId}.${vendorId}.${deliveryId}`,
    name: "",
    amount: 1,
    symbol: "",
    vendorIdStoreIdChannelId:
      storeChannels?.map(channel => `${vendorId}.${storeId}.${channel}`) ?? [],
    grossPrice: 0.0,
    netPrice: shippingCost,
    subtotalBeforeTaxes: 0.0,
    taxes: [],
    taxTotal: 0,
    discounts: [],
    discountTotal: 0,
    total: 0,
    account: { accountId },
    vendor: { id: vendorId }
  };
};
