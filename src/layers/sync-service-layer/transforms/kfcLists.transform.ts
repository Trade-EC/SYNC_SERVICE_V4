export const transformList = (list: any) => {
  delete list.stores;
  list.vendorId = String(list.vendorId);
  list.storeId = String(list.storeId);

  return list;
};

export const transformProducts = (products: any[]) => {
  return products.map(product => {
    product.productId = String(product.productId);
    product.tags = product.tags?.replace("[", "").replace("]", "").split(",");
    product.upselling = product.upselling
      ?.replace("[", "")
      .replace("]", "")
      .split(",");
    if (product.priceInfo && product.priceInfo.length > 0) {
      product.priceInfo = product.priceInfo[0];
    }
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

export const transformCategories = (categories: any[]) => {
  return categories.map(category => {
    const { images, productListing, childCategories } = category;
    if (images === null) {
      delete category.images;
    }
    category.productListing = productListing?.map((productListing: any) => {
      productListing.productId = String(productListing.productId);
      return productListing;
    });

    category.childCategories = transformCategories(childCategories ?? []);

    return category;
  });
};

export const transformModifierGroups = (modifierGroups: any[]) => {
  return modifierGroups.map(modifierGroup => {
    modifierGroup.modifierOptions = modifierGroup.modifierOptions
      .map((modifierOption: any) => {
        modifierOption.productId = String(modifierOption.productId);
        return modifierOption;
      })
      .filter((modifierOption: any) => {
        if (Array.isArray(modifierOption)) return false;
        return true;
      });
    return modifierGroup;
  });
};
