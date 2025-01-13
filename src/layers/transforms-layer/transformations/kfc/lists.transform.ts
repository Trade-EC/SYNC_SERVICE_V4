import { isUndefined } from "../../../sync-service-layer/utils/common.utils";

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
    product.upselling =
      typeof product.upselling === "string"
        ? product.upselling
            ?.replace("[", "")
            .replace("]", "")
            .replaceAll("'", "")
            .split(",")
        : product.upselling;
    if (product.priceInfo && product.priceInfo.length > 0) {
      product.priceInfo = product.priceInfo[0];
    }
    if (product.description === null) {
      delete product.description;
    }
    if (!product.productModifiers) {
      product.productModifiers = [];
    }
    if (product.images && process.env.FORCE_UPDATE_IMAGES_PRODUCTS === "true") {
      product.images = product.images.map((image: any) => {
        image.fileUrl = `${image.fileUrl}?tz=${new Date().getTime()}`;
        return image;
      });
    }

    return product;
  });
};

export const transformCategories = (categories: any[]) => {
  return categories.map(category => {
    const { images, productListing, childCategories, schedules } = category;
    category.images = images?.filter((image: any) => !!image.fileUrl);
    if (images === null) {
      delete category.images;
    }

    if (schedules) {
      category.schedules = transformSchedules(schedules);
    }

    category.images = category.images
      ? category.images.map((image: any) => {
          image.fileUrl = `${image.fileUrl}?tz=${new Date().getTime()}`;
          return image;
        })
      : [];

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
        if (
          isUndefined(modifierOption.productId) ||
          isUndefined(modifierOption.optionId)
        )
          return false;
        return true;
      });
    return modifierGroup;
  });
};

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

  return transformedLists;
};

export const transformSchedules = (schedules: any) => {
  const daysOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
  ];
  const completeSchedules = daysOfWeek.map(day => {
    const schedule = schedules.find((schedule: any) => schedule.day === day);
    if (schedule) {
      return schedule;
    }
    return {
      day,
      startTime: "00:00",
      endTime: "00:00"
    };
  });
  return completeSchedules;
};
