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
    grossPrice: shippingCost,
    externalId: deliveryId,
    netPrice: shippingCost,
    subtotalBeforeTaxes: shippingCost,
    taxes: [],
    taxTotal: 0,
    discounts: [],
    discountTotal: 0,
    total: shippingCost,
    account: { accountId },
    vendor: { id: `${accountId}.${countryId}.${vendorId}` }
  };
};
