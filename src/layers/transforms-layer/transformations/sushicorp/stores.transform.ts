const transformStores = (stores: any[]) => {
  return stores.map((store: any) => {
    if (!store.default) {
      store.default = false;
    }
    if (store.schedules === null) {
      store.schedules = [];
    }
    return store;
  });
};

const transformChannels = (channels: any[]) => {
  return channels.map((channel: any) => {
    if (channel.additionalInfo === null) {
      channel.additionalInfo = {};
    }
    return channel;
  });
};

export const transformSCStores = (channelsAndStores: any) => {
  const transformedChannelsAndStores = channelsAndStores;

  const { stores, channels, vendorId } = transformedChannelsAndStores;

  transformedChannelsAndStores.vendorId = String(vendorId);
  transformedChannelsAndStores.stores = transformStores(stores);
  transformedChannelsAndStores.channels = transformChannels(channels);

  return transformedChannelsAndStores;
};
