import { DBStore, Store } from "./createStores.types";

import { transformStoreSchedules } from "/opt/nodejs/sync-service-layer/utils/schedule.utils";
import { transformStoreSchedulesByChannel } from "/opt/nodejs/sync-service-layer/utils/schedule.utils";
import { getTaxes } from "/opt/nodejs/sync-service-layer/transforms/product.transform";

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
  vendorId: string
) => {
  const { storeId, name, contactInfo, locationInfo, schedules } = store;
  const { schedulesByChannel, storeChannels, deliveryInfo } = store;
  const { services, active, default: isDefault, featured } = store;
  const { storeCode, taxesInfo } = store;
  const { deliveryId } = deliveryInfo ?? {};
  const transformedSchedules = schedules
    ? transformStoreSchedules(schedules, storeChannels, storeId)
    : [];
  const transformedSchedulesByChannel = schedulesByChannel
    ? transformStoreSchedulesByChannel(schedulesByChannel, storeId)
    : [];

  const newStore: DBStore = {
    storeId: `${accountId}.${vendorId}.${storeId}`,
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
    catalogues: [],
    polygons: null,
    sponsored: !!featured, // Debería salir del vendor
    tips: [], // Salen del vendor
    timezone: null,
    location: { lat: locationInfo.latitude, lon: locationInfo.longitude },
    additionalInfo: { externalId: storeId, external_code: storeCode },
    city: { id: "", name: locationInfo.city, active: false },
    country: null,
    vendor: { id: vendorId },
    accounts: [{ accountId }],
    account: { id: accountId },
    shippingCostId:
      typeof deliveryId !== "undefined"
        ? `${accountId}.${vendorId}.${deliveryId}`
        : null
  };

  return newStore;
};
