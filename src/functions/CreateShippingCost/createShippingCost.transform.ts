import { CreateShippingCostProps } from "./createShippingCost.types";
import { DBShippingCost } from "./createShippingCost.types";

export const shippingCostTransformer = (
  props: CreateShippingCostProps
): DBShippingCost => {
  const { shippingCost, deliveryId, channelMappings } = props;
  const { storeId, accountId, vendorId, countryId } = props;
  return {
    shippingCostId: `${accountId}.${countryId}.${vendorId}.${deliveryId}`,
    name: "",
    amount: 1,
    symbol: "",
    vendorIdStoreIdChannelId:
      channelMappings?.map(channel => `${vendorId}.${storeId}.${channel.id}`) ??
      [],
    grossPrice: 0.0,
    externalId: deliveryId,
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
