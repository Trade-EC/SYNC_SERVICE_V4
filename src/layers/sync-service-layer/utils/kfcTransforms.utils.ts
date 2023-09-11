import { listsValidator } from "src/functions/CreateLists/createLists.validator";

export const transformKFCList = (lists: any) => {
  let transformedLists = lists;

  if (lists.length) {
    transformedLists = lists[0];
  }

  if (transformedLists.list.length) {
    transformedLists.list = transformedLists.list[0];
  }

  const { list, products, categories, modifierGroups } = transformedLists;

  transformedLists.list = transformList(list);
  transformedLists.products = transformProducts(products);
  transformedLists.categories = transformCategories(categories);
  transformedLists.modifierGroups = transformModifierGroups(modifierGroups);

  const validationResult = listsValidator.safeParse(transformedLists);
  if (!validationResult.success) {
    throw new Error(validationResult.error.message);
  }

  return transformedLists;
};

const transformList = (list: any) => {
  delete list.stores;
  list.vendorId = String(list.vendorId);
  list.storeId = String(list.storeId);

  return list;
};

const transformProducts = (products: any[]) => {
  return products.map(product => {
    product.productId = String(product.productId);
    product.priceInfo = product.priceInfo[0];
    if (product.taxInfo && product.taxInfo.length > 0) {
      product.taxInfo = product.taxInfo[0];
    }
    if (product.description === null) {
      delete product.description;
    }
    if (!product.productModifiers) {
      product.productModifiers = [];
    }
    return product;
  });
};

const transformCategories = (categories: any[]) => {
  return categories.map(category => {
    if (category.images === null) {
      delete category.images;
    }
    category.productListing = category.productListing.map(
      (productListing: any) => {
        productListing.productId = String(productListing.productId);
        return productListing;
      }
    );
    return category;
  });
};

const transformModifierGroups = (modifierGroups: any[]) => {
  return modifierGroups.map(modifierGroup => {
    modifierGroup.modifierOptions = modifierGroup.modifierOptions.map(
      (modifierOption: any) => {
        modifierOption.productId = String(modifierOption.productId);
        return modifierOption;
      }
    );
    return modifierGroup;
  });
};
