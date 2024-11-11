import { faker } from "@faker-js/faker";

import { Channel, ChannelsAndStores, Store } from "./stores.builders.types";

export const buildChannel = (overrides: Partial<Channel> = {}): Channel => {
  return {
    active: faker.datatype.boolean(),
    channelId: faker.string.uuid(),
    channel: faker.lorem.words(2),
    ...overrides
  };
};

export const genChannels = (quantity = 5) => {
  return faker.helpers.multiple(buildChannel, {
    count: { min: 1, max: quantity }
  });
};

const channels = genChannels();

export const buildStore = (overrides: Partial<Store> = {}): Store => {
  return {
    active: faker.datatype.boolean(),
    contactInfo: {
      address: faker.location.streetAddress(),
      phone: faker.phone.number()
    },
    default: faker.datatype.boolean(),
    locationInfo: {
      city: faker.location.city(),
      // @ts-ignore zod type error when transform string to number
      latitude: faker.location.latitude().toString(),
      // @ts-ignore zod type error when transform string to number
      longitude: faker.location.longitude().toString()
    },
    name: faker.company.name(),
    storeId: faker.string.uuid(),
    storeChannels: faker.helpers.arrayElements(
      channels.map(channel => channel.channelId),
      { min: 1, max: 3 }
    ),
    featured: faker.datatype.boolean(),
    deliveryInfo: {
      cookTime: faker.number.int(),
      minimumOrder: faker.number.int(),
      deliveryTimeValue: faker.number.int(),
      deliveryTimeUnit: faker.helpers.arrayElement(["min", "hour"]),
      shippingCost: +faker.finance.amount()
    },
    taxesInfo: [
      {
        vatRatePercentage: faker.number.int()
      }
    ],
    ...overrides
  };
};

export const genStores = (quantity = 5) => {
  return faker.helpers.multiple(buildStore, {
    count: { min: 1, max: quantity }
  });
};

export const buildChannelsAndStores = (
  overrides: Partial<ChannelsAndStores> = {}
): ChannelsAndStores => {
  return {
    vendorId: faker.string.uuid(),
    channels,
    stores: genStores(),
    ...overrides
  };
};
