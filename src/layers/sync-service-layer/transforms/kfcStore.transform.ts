import { z } from "zod";

export const transformKFCStores = <T extends z.Schema<any, any>>(
  channelsAndStores: any,
  validator: T
) => {
  const transformedChannelsAndStores = channelsAndStores;

  if (!transformedChannelsAndStores.vendorId) {
    transformedChannelsAndStores.vendorId =
      channelsAndStores.stores[0].vendorId;
  }

  const { stores, channels, vendorId } = transformedChannelsAndStores;

  transformedChannelsAndStores.vendorId = String(vendorId);
  transformedChannelsAndStores.stores = transformStores(stores);
  transformedChannelsAndStores.channels = transformChannels(channels);

  const validationResult = validator.safeParse(transformedChannelsAndStores);

  if (!validationResult.success) {
    throw new Error(JSON.stringify(validationResult.error, null, 2));
  }

  return transformedChannelsAndStores;
};

const transformStores = (stores: any[]) => {
  return stores.map((store: any) => {
    if (!store.deafult) {
      store.default = false;
    }
    store.storeId = String(store.storeId);
    if (store.storeChannels.length) {
      store.storeChannels = store.storeChannels.map(
        (storeChannel: any) => storeChannel.channelId ?? storeChannel
      );
    } else {
      store.storeChannels = Object.values(store.storeChannels);
    }
    if (store.taxesInfo && store.taxesInfo.length > 0) {
      store.taxesInfo = store.taxesInfo[0];
    }
    if (store.deliveryInfo && store.deliveryInfo.length > 0) {
      store.deliveryInfo = store.deliveryInfo[0];
    }
    store = transformStoresDeliveryInfo(store);
    if (store.contactInfo && store.contactInfo.length > 0) {
      store.contactInfo = store.contactInfo[0];
    }
    if (store.locationInfo && store.locationInfo.length > 0) {
      store.locationInfo = store.locationInfo[0];
    }
    store = transformStoreServices(store);
    if (store.paymentMethodInfo === null) {
      delete store.paymentMethodInfo;
    }
    if (!store.storeChannels) {
      store.storeChannels = [];
    }
    delete store.vendorId;
    return store;
  });
};

const transformChannels = (channels: any[]) => {
  return channels.map((channel: any) => {
    if (channel.additionalInfo && channel.additionalInfo.length > 0) {
      channel.additionalInfo = channel.additionalInfo[0];
    }
    return channel;
  });
};

const transformStoresDeliveryInfo = (store: any) => {
  if (store.deliveryInfo[0] && store.deliveryInfo[0].length) {
    delete store.deliveryInfo;
  } else {
    store.deliveryInfo = store.deliveryInfo[0];
    if (store.deliveryInfo) {
      if (store.deliveryInfo.minimumOrder) {
        store.deliveryInfo.minimumOrder = Number(
          store.deliveryInfo.minimumOrder
        );
      }
      if (store.deliveryInfo.shippingCost) {
        store.deliveryInfo.shippingCost = Number(
          store.deliveryInfo.shippingCost
        );
      }
      if (store.deliveryInfo.deliveryTimeValue) {
        store.deliveryInfo.deliveryTimeValue = Math.round(
          Number(store.deliveryInfo.deliveryTimeValue)
        );
      }
      if (store.deliveryInfo.cookTime) {
        store.deliveryInfo.cookTime = Math.round(
          Number(store.deliveryInfo.cookTime)
        );
      }
    }
  }
  return store;
};

const transformStoreServices = (store: any) => {
  if (typeof store.services === "undefined") return store;
  if (store.services === null) {
    delete store.services;
  } else {
    store.services = store.services.map((service: any) => ({
      name: service.name,
      active: service.active ? "ACTIVE" : "INACTIVE"
    }));
  }
  return store;
};
