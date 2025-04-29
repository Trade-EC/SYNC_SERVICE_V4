import { faker } from "@faker-js/faker";

import { Category, Lists, Products } from "./lists.builders.types";
import { ModifierGroup, ModifierOption, Product } from "./lists.builders.types";

export const buildModifierOptions = (
  overrides: Partial<ModifierOption> = {}
): ModifierOption => {
  return {
    optionId: faker.string.uuid(),
    productId: faker.string.uuid(),
    position: faker.number.int(),
    default: faker.datatype.boolean(),
    ...overrides
  };
};

export const genModifierOptions = (quantity = 5) => {
  return faker.helpers.multiple(buildModifierOptions, {
    count: { min: 1, max: quantity }
  });
};

export const buildModifierGroup = (
  overrides: Partial<ModifierGroup> = {}
): ModifierGroup => {
  return {
    maxOptions: 3,
    minOptions: 1,
    modifier: faker.lorem.words(2),
    modifierId: faker.string.uuid(),
    position: faker.number.int(),
    type: "CUSTOM",
    visible: faker.datatype.boolean(),
    modifierOptions: genModifierOptions(),
    ...overrides
  };
};

export const genModifierGroups = (quantity = 5) => {
  return faker.helpers.multiple(buildModifierGroup, {
    count: { min: 0, max: quantity }
  });
};

export const buildProduct = (overrides: Partial<Product> = {}): Product => {
  return {
    name: faker.lorem.words(2),
    productId: faker.string.uuid(),
    description: faker.lorem.words(2),
    standardTime: faker.datatype.boolean(),
    featured: faker.datatype.boolean(),
    minAmountForSale: faker.number.int(),
    maxAmountForSale: faker.number.int(),
    type: faker.helpers.arrayElement([
      "PRODUCT",
      "MODIFIER",
      "COMPLEMENT",
      "PRODUCTO",
      "MODIFICADOR",
      "COMPLEMENTO"
    ]),
    priceInfo: {
      price: +faker.finance.amount({ max: 10 })
    },
    ...overrides
  };
};

export const genProducts = (quantity = 5) => {
  return faker.helpers.multiple(buildProduct, {
    count: { min: 1, max: quantity }
  });
};

export const buildCategory = (overrides: Partial<Category> = {}): Category => {
  return {
    productCategoryId: faker.string.uuid(),
    name: faker.lorem.words(2),
    displayInList: faker.datatype.boolean(),
    featured: faker.datatype.boolean(),
    crossSellingCategory: faker.datatype.boolean(),
    position: faker.number.int(),
    productListing: [],
    ...overrides
  };
};

export const genCategories = (quantity = 5) => {
  return faker.helpers.multiple(buildCategory, {
    count: { min: 1, max: quantity }
  });
};

export const buildListRequest = (overrides: Partial<Lists> = {}): Lists => {
  return {
    list: {
      channelId: faker.string.uuid(),
      listId: faker.string.uuid(),
      listName: faker.lorem.words(2),
      storeId: faker.string.uuid(),
      vendorId: faker.string.uuid()
    },
    categories: genCategories(),
    products: genProducts(),
    modifierGroups: [],
    ...overrides
  };
};

export const buildProductRequest = (
  overrides: Partial<Products> = {}
): Products => {
  return {
    list: {
      channelId: faker.string.uuid(),
      listId: faker.string.uuid(),
      listName: faker.lorem.words(2),
      storeId: faker.string.uuid(),
      vendorId: faker.string.uuid()
    },
    categories: genCategories(),
    products: genProducts(),
    modifierGroups: genModifierGroups(),
    ...overrides
  };
};
