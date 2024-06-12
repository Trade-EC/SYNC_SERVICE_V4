const transformStores = (stores: any[]) => {
  return stores.map((store: any) => {
    if (!store.default) {
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

export const transformMulticinesStores = (channelsAndStores: any) => {
  const transformedChannelsAndStores = channelsAndStores;

  if (!transformedChannelsAndStores.vendorId) {
    transformedChannelsAndStores.vendorId =
      channelsAndStores.stores[0].vendorId;
  }

  const { stores, channels, vendorId } = transformedChannelsAndStores;
  const storeVendorId = stores[0].vendorId;

  transformedChannelsAndStores.vendorId = String(vendorId ?? storeVendorId);
  transformedChannelsAndStores.stores = transformStores(stores);
  transformedChannelsAndStores.channels = transformChannels(channels);

  return transformedChannelsAndStores;
};
