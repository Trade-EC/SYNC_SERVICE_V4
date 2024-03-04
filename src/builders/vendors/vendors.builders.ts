import { faker } from "@faker-js/faker";

import { Vendor, VendorChannel } from "./vendors.builders.types";

export const buildVendorChannel = (
  overrides: Partial<VendorChannel> = {}
): VendorChannel => {
  return {
    active: faker.datatype.boolean(),
    channelId: faker.string.uuid(),
    name: faker.lorem.words(2),
    ecommerceChannelId: null,
    channelReferenceName: null,
    ...overrides
  };
};

export const genVendorChannels = (quantity = 5) => {
  return faker.helpers.multiple(buildVendorChannel, {
    count: { min: 1, max: quantity }
  });
};

export const buildVendor = (overrides: Partial<Vendor> = {}): Vendor => {
  const time = faker.date.recent();
  return {
    active: true,
    vendorId: faker.string.uuid(),
    name: faker.company.name(),
    account: { accountId: faker.string.uuid() },
    syncTimeUnit: "EVERYDAY",
    syncTimeValue: `${time.getHours()}:${time.getMinutes()}`,
    channels: genVendorChannels(),
    ...overrides
  };
};

export const genVendors = (quantity = 5) => {
  return faker.helpers.multiple(buildVendor, {
    count: { min: 1, max: quantity }
  });
};
