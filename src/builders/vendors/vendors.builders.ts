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
  const clientVendorId = faker.string.uuid();
  const accountId = faker.string.uuid();
  const vendorId = `${accountId}.${countryId}.${clientVendorId}`;
  const vendorTaxes = { vatRatePercentage: 15 };
  return {
    vendorId,
    active: true,
    name: faker.company.name(),
    account: { accountId },
    syncTimeUnit: "EVERYDAY",
    countryId,
    externalId: clientVendorId,
    isSyncActive: true,
    taxes: vendorTaxes,
    automaticallyPublishSync: false,
    syncTimeValue: "00:00",
    ...overrides
  };
};

export const genVendors = (countryId: string, quantity = 5) => {
  return faker.helpers.multiple(() => buildVendor(countryId), {
    count: { min: 1, max: quantity }
  });
};
