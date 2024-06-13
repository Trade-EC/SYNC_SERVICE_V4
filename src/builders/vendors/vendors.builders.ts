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

export const buildVendor = (
  countryId: string,
  overrides: Partial<Vendor> = {}
): Vendor => {
  const time = faker.date.recent();
  const clientVendorId = faker.string.uuid();
  const accountId = faker.string.uuid();
  const vendorId = `${accountId}.${countryId}.${clientVendorId}`;
  return {
    vendorId,
    active: true,
    name: faker.company.name(),
    account: { accountId },
    syncTimeUnit: "EVERYDAY",
    syncTimeValue: `${time.getHours()}:${time.getMinutes()}`,
    channels: genVendorChannels(),
    countryId,
    externalId: clientVendorId,
    isSyncActive: true,
    description: faker.lorem.sentence(),
    ...overrides
  };
};

export const genVendors = (countryId: string, quantity = 5) => {
  return faker.helpers.multiple(() => buildVendor(countryId), {
    count: { min: 1, max: quantity }
  });
};
