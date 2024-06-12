import { DBStore, Store } from "./createStores.types";

import { transformStoreSchedules } from "/opt/nodejs/sync-service-layer/utils/schedule.utils";
import { transformStoreSchedulesByChannel } from "/opt/nodejs/sync-service-layer/utils/schedule.utils";
import { getTaxes } from "/opt/nodejs/sync-service-layer/transforms/product.transform";
import { ChannelMappings } from "/opt/nodejs/sync-service-layer/types/channel.types";

export const catalogueTransformer = (
  channelMappings: ChannelMappings[],
  vendorId: string,
  storeId: string
) => {
  const catalogues = channelMappings.map(channel => {
    const { externalChannelId, name, id } = channel;
    return {
      catalogueId: `${vendorId}.${storeId}.${id ?? externalChannelId}`,
      name,
      active: true
    };
  });

  return catalogues;
};

/**
 *
 * @param store request store
 * @param accountId
 * @param vendorId
 * @description Transform store into DBStore
 * @returns DBStore
 */
export const storeTransformer = (
  store: Store,
  accountId: string,
  vendorId: string,
  channelsMappings: ChannelMappings[],
  countryId: string
) => {
  const { storeId, name, contactInfo, locationInfo, schedules } = store;
  const { schedulesByChannel, deliveryInfo } = store;
  const { services, active, default: isDefault, featured } = store;
  const { storeCode, taxesInfo } = store;
  const { deliveryId } = deliveryInfo ?? {};
  const transformedSchedules = schedules
    ? transformStoreSchedules(schedules, channelsMappings, storeId)
    : [];
  const transformedSchedulesByChannel = schedulesByChannel
    ? transformStoreSchedulesByChannel(
        schedulesByChannel,
        storeId,
        channelsMappings
      )
    : [];

  const newStore: DBStore = {
    storeId: `${accountId}.${countryId}.${vendorId}.${storeId}`,
    version: null,
    hash: null,
    status: "DRAFT" as const,
    storeName: name,
    maxOrderAmount: 0,
    address: contactInfo.address,
    latitude: locationInfo.latitude,
    longitude: locationInfo.longitude,
    schedules: [...transformedSchedules, ...transformedSchedulesByChannel],
    description: "",
    phone: contactInfo.phone,
    minOrderAmount: deliveryInfo?.minimumOrder ?? 0,
    services:
      services
        ?.map(service => ({ ...service, active: service.active === "ACTIVE" }))
        .filter(service => service.active) ?? [],
    taxes: getTaxes(taxesInfo),
    active: active,
    isDefault,
    outOfService: false,
    cookTime: deliveryInfo?.cookTime ?? 0,
    enableTips: false, // Salen del vendor
    images: [], // Salen del vendor
    minOrder: deliveryInfo?.minimumOrder ?? 0,
    minOrderSymbol: null,
    orderSymbol: null,
    catalogues: catalogueTransformer(channelsMappings, vendorId, storeId),
    polygons: null,
    sponsored: !!featured, // Debería salir del vendor
    tips: [], // Salen del vendor
    timezone: null,
    location: { lat: locationInfo.latitude, lon: locationInfo.longitude },
    additionalInfo: {
      externalId: storeId,
      externalCode: storeCode,
      idDeliveryKfc: deliveryId
    },
    city: { id: "", name: locationInfo.city, active: false },
    country: null,
    vendor: { id: `${accountId}.${countryId}.${vendorId}` },
    accounts: [{ accountId }],
    account: { id: accountId },
    shippingCostId:
      typeof deliveryId !== "undefined"
        ? `${accountId}.${countryId}.${vendorId}.${deliveryId}`
        : null
  };

  return newStore;
};
