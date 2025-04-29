import { cloneDeep, isEqual } from "lodash";

import { logger } from "../configs/observability.config";
import { DbCategory, DbProduct, DbQuestion } from "../types/products.types";
import { normalizeProductType } from "../utils/common.utils";
import { imageHandler } from "../utils/images.utils";

import { Category } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { PriceInfo } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { ModifierGroup } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { TaxesInfo } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { TransformProductsProps } from "/opt/nodejs/sync-service-layer/types/lists.types";
import { transformSchedules } from "/opt/nodejs/sync-service-layer/utils/schedule.utils";

/**
 *
 * @param categories
 * @param productId
 * @param storesId
 * @param channelId
 * @param vendorId
 * @description Transform categories by product into DbCategory
 * @returns {Promise<DbCategory[]>}
 */
export const transformCategoriesByProduct = async (
  categories: Category[],
  productId: string,
  storesId: string[],
  channelId: string,
  vendorId: string
) => {
  const categoriesByProduct = categories.filter(category =>
    category.productListing.some(listing => listing.productId === productId)
  );

  const categoriesByProductPromises = categoriesByProduct.map(category =>
    transformCategory(category, storesId, channelId, vendorId, productId)
  );

  return Promise.all(categoriesByProductPromises);
};

/**
 *
 * @param category
 * @param storesId
 * @param channelId
 * @param vendorId
 * @param productId
 * @param parentId
 * @description Transform category into DbCategory
 * @returns {Promise<DbCategory>}
 */
export const transformCategory = async (
  category: Category,
  storesId: string[],
  channelId: string,
  vendorId: string,
  productId: string,
  parentId?: string
) => {
  const { name, productCategoryId, schedules, images } = category;
  const { featured, productListing, displayInList } = category;
  const { childCategories = [] } = category;
  const { position: categoryPosition } = category;
  const productInCategory = productListing.find(
    listing => listing.productId === productId
  );
  const { position } = productInCategory ?? {};

  const imagesPromises = images?.map(image =>
    imageHandler(image.fileUrl, image.imageCategoryId ?? "category")
  );
  const childCategoriesPromises = childCategories.map(childCategory =>
    transformCategory(
      childCategory,
      storesId,
      channelId,
      productCategoryId,
      productId,
      parentId
    )
  );
  const newImages = await Promise.all(imagesPromises ?? []);
  const newChildCategories = await Promise.all(childCategoriesPromises);

  const newCategory: DbCategory = {
    categoryId: productCategoryId,
    name,
    images: newImages,
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId, vendorId)
      : [],
    subcategories: newChildCategories,
    parentId: parentId ? parentId : "",
    standardTime: schedules ? "YES" : "NO",
    reload: false,
    additionalInfo: {
      externalId: productCategoryId
    },
    featured: featured ? featured : false,
    available: true,
    active: true,
    categoryPosition: categoryPosition ? categoryPosition : 0,
    position: position ? position : 0,
    displayInMenu: displayInList ? "YES" : "NO",
    vendorIdStoreIdChannelId: storesId
      .map(storeId => `${vendorId}.${storeId}.${channelId}`)
      .sort()
  };
  return newCategory;
};

/**
 *
 * @param price
 * @param taxesInfo
 * @description Calculate taxes and gross price
 * @returns {{grossPrice: number, taxes: {name: string, percentage: number}[]}}
 */
export const getTaxes = (taxesInfo: TaxesInfo | undefined) => {
  const taxes: any[] = [];

  if (!taxesInfo) return taxes;

  for (const tax of taxesInfo) {
    const { type, vatRatePercentage } = tax;
    const taxName = type ?? !taxes.length ? "IVA" : "OTROS";
    taxes.push({
      percentage: vatRatePercentage,
      name: `${taxName} ${vatRatePercentage}%`,
      vatRateCode: vatRatePercentage,
      code: vatRatePercentage,
      vatRate: `${vatRatePercentage}%`
    });
  }

  return taxes;
};

export const calculateGrossPrice = (
  price: number,
  taxes: TaxesInfo | undefined
) => {
  if (!taxes) return price;
  const { vatRatePercentage = 0 } = taxes[0];
  const sumTaxes = vatRatePercentage;
  const totalTaxes = 1 + sumTaxes / 100;
  const grossPrice = Math.floor((price / totalTaxes) * 10000) / 10000;
  return grossPrice;
};

/**
 *
 * @param priceInfo
 * @param taxesInfo
 * @description Transform prices into DbProduct["prices"]
 * @returns {DbProduct["prices"]}
 */
export const transformPrices = (
  priceInfo: PriceInfo,
  taxesInfo: TaxesInfo | undefined,
  vendorTaxes: TaxesInfo | undefined
) => {
  const { price, pointPrice, suggestedPointPrice, suggestedPrice, salePrice } =
    priceInfo;
  const productPrice: any = {};
  const taxes = taxesInfo ?? vendorTaxes;
  const netPrice = salePrice ?? price;
  const priceBeforeSale = salePrice ? price : 0;
  const grossPriceForSale = salePrice
    ? calculateGrossPrice(priceBeforeSale, taxes)
    : 0;

  const salePercentage = salePrice ? 1 - netPrice / priceBeforeSale : 0;
  const saleValue = salePrice ? grossPriceForSale * salePercentage : 0;

  const normal = {
    category: "NORMAL",
    symbol: "",
    netPrice: netPrice,
    taxes: getTaxes(taxes),
    grossPrice: calculateGrossPrice(netPrice, taxes),
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0,
    priceBeforeSale,
    grossPriceForSale,
    salePercentageDecimal: salePercentage,
    salePercentage: +(salePercentage * 100).toFixed(0),
    saleValue
  };

  const points = {
    category: "POINTS",
    symbol: "",
    netPrice: pointPrice ?? 0,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0,
    priceBeforeSale: 0,
    grossPriceForSale: 0,
    salePercentageDecimal: 0,
    salePercentage: 0,
    saleValue: 0
  };

  const suggested = {
    category: "SUGGESTED",
    symbol: "",
    netPrice: suggestedPrice ?? 0,
    taxes: getTaxes(taxesInfo),
    grossPrice: calculateGrossPrice(suggestedPrice ?? 0, taxes),
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0,
    priceBeforeSale: 0,
    grossPriceForSale: 0,
    salePercentageDecimal: 0,
    salePercentage: 0,
    saleValue: 0
  };

  const suggestedPoints = {
    category: "SUGGESTED_POINTS",
    symbol: "",
    netPrice: suggestedPointPrice ?? 0,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0,
    priceBeforeSale: 0,
    grossPriceForSale: 0,
    salePercentageDecimal: 0,
    salePercentage: 0,
    saleValue: 0
  };

  productPrice["NORMAL"] = normal;

  if (pointPrice && pointPrice > 0) {
    productPrice["POINTS"] = points;
  }
  if (suggestedPrice && suggestedPrice > 0) {
    productPrice["SUGGESTED"] = suggested;
  }
  if (suggestedPointPrice && suggestedPointPrice > 0) {
    productPrice["SUGGESTED_POINTS"] = suggestedPoints;
  }

  return productPrice;
};

/**
 *
 * @param modifierGroup
 * @description Transform modifier group into DbQuestion
 * @returns DbQuestion
 */
export const transformModifierGroup = (modifierGroup: ModifierGroup) => {
  const { modifier, modifierId, maxOptions } = modifierGroup;
  const { minOptions, additionalInfo } = modifierGroup; // type is not using

  let description = "";

  if (minOptions === 1 && maxOptions === 1) {
    description = "Es necesario elegir uno";
  } else if (minOptions === 0 && maxOptions !== 0) {
    description = `Puede seleccionar hasta ${maxOptions} ${
      maxOptions === 1 ? "opción" : "opciones"
    }`;
  } else if (minOptions !== 0 && maxOptions !== 0) {
    description = `Seleccione al menos ${minOptions} ${
      minOptions === 1 ? "opción" : "opciones"
    } y máximo ${maxOptions} ${maxOptions === 1 ? "opción" : "opciones"}`;
  }

  const question = {
    questionId: modifierId,
    externalId: modifierId,
    name: modifier,
    description,
    min: minOptions,
    max: maxOptions,
    additionalInfo: additionalInfo ? additionalInfo : null,
    visible: true
  };
  return question;
};

/**
 *
 * @param props {@link TransformProductsProps}
 * @description Transform product into DbProduct
 * @returns DbProduct
 */
export const transformProduct = async (props: TransformProductsProps) => {
  const { product, channelId, storesId, vendorId, modifierGroups } = props;
  const { categories, accountId, countryId, vendorTaxes } = props;
  const { productId, name, description, type, featured } = product;
  const { tags, additionalInfo, standardTime, schedules } = product;
  const { priceInfo, taxInfo, productModifiers, upselling } = product;
  const { minAmountForSale, maxAmountForSale } = product;
  const { images } = product;
  const { suggestedPrice } = priceInfo;

  // @ts-ignore filter check if modifier exists
  const questions: DbQuestion[] = productModifiers
    ?.map((productModifier, questionIndex) => {
      let productModifierId = "";
      let questionPosition;
      if (typeof productModifier === "string") {
        productModifierId = productModifier;
      } else {
        productModifierId = productModifier.modifierId;
        questionPosition = productModifier.position;
      }
      const modifierGroup = modifierGroups.find(
        modifierGroup =>
          modifierGroup.modifierId.toString() === productModifierId.toString()
      );
      if (!modifierGroup) return undefined;
      const syncModifiers: any = modifierGroup?.modifierOptions
        .map(modifier => {
          const { productId, optionId, default: isDefault } = modifier;
          return {
            productId: `${accountId}.${countryId}.${vendorId}.${productId}`,
            attributes: {
              externalId: productId,
              showInMenu: true,
              answerExternalId: optionId,
              default: !!isDefault
            },
            questionId: modifierGroup.modifierId
          };
        })
        .filter(modifier => !!modifier);

      const question: DbQuestion = {
        ...transformModifierGroup(modifierGroup),
        position: questionPosition ?? questionIndex,
        answers: syncModifiers
      };
      return question;
    })
    ?.filter(modifier => !!modifier);
  const imagesPromises = images?.map(image =>
    imageHandler(image.fileUrl, image.imageCategoryId ?? "product")
  );
  const newImages = await Promise.all(imagesPromises ?? []);

  const syncCategories = await transformCategoriesByProduct(
    categories,
    productId,
    storesId,
    channelId,
    vendorId
  );

  if (type === "PRODUCTO" && priceInfo.price === 0) {
    logger.warn("PRODUCT: PRICE IS 0", {
      productId: `${accountId}.${countryId}.${vendorId}.${productId}`
    });
  }

  const newProduct: DbProduct = {
    hash: null,
    productId: `${accountId}.${countryId}.${vendorId}.${productId}`,
    status: "DRAFT",
    version: null,
    name: name.trim(),
    description,
    type: normalizeProductType(type),
    measure: null,
    stock: null,
    manufacturer: null,
    coverUrl: null, // Vendor images
    available: true,
    attributes: {
      Cantidad: "1",
      externalId: productId,
      showInMenu: true
    },
    images:
      newImages?.map(image => ({
        vendorIdStoreIdChannelId: storesId
          .map(storeId => `${vendorId}.${storeId}.${channelId}`)
          .sort(),
        ...image
      })) ?? [],
    additionalInfo: additionalInfo ? additionalInfo : null,
    tags: tags ? tags : [],
    prices: [
      {
        vendorIdStoreIdChannelId: storesId
          .map(storeId => `${vendorId}.${storeId}.${channelId}`)
          .sort(),
        prices: transformPrices(priceInfo, taxInfo, vendorTaxes)
      }
    ],
    categories: syncCategories,
    externalData: null, // No se encontró en el PHP
    isPriceVip: false,
    outOfService: false,
    outOfStock: false,
    sponsored: !!featured,
    suggestedPrice: suggestedPrice ? +suggestedPrice.toPrecision(2) : 0,
    maxAmountForSale: maxAmountForSale,
    minAmountForSale: minAmountForSale,
    statuses: [
      {
        vendorIdStoreIdChannelId: storesId
          .map(storeId => `${vendorId}.${storeId}.${channelId}`)
          .sort(),
        availability: true,
        isVisible: true,
        maxInCart: null,
        minInCart: null,
        promoted: {
          isPromotionActive: false,
          discountPercentage: null
        }
      }
    ],
    questions:
      questions?.map(question => {
        return {
          vendorIdStoreIdChannelId: storesId
            .map(storeId => `${vendorId}.${storeId}.${channelId}`)
            .sort(),
          ...question
        };
      }) ?? [],
    hasModifiers: questions?.length ? true : false,
    upselling: upselling ? upselling : [],
    standardTime: standardTime || schedules ? "YES" : "NO", // Si me llegan schedules standardTime YES si no NO
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId, vendorId)
      : [],
    vendor: {
      id: `${accountId}.${countryId}.${vendorId}`
    },
    account: {
      accountId
    }
  };

  return newProduct;
};

/**
 *
 * @param dbEntities
 * @param newEntities
 * @param vendorIdStoreIdChannelId
 * @description Merge entities
 * @returns {any}
 */
export const mergeEntity = (
  dbEntities: any,
  newEntities: any,
  vendorIdStoreIdChannelId: string[]
) => {
  const temporalEntities = cloneDeep(dbEntities);
  // Delete ids with vendor, store and channel id combination.
  const temporalEntitiesCleaned = temporalEntities.map(
    (temporalEntity: any) => {
      const { vendorIdStoreIdChannelId: oldIds } = temporalEntity;
      return {
        ...temporalEntity,
        vendorIdStoreIdChannelId: oldIds.filter(
          (oldId: any) => !vendorIdStoreIdChannelId.includes(oldId)
        )
      };
    }
  );

  for (const entity of newEntities) {
    const { vendorIdStoreIdChannelId: ids, ...restNewEntity } = entity;
    const foundEntityIndex = temporalEntitiesCleaned.findIndex(
      (dbEntity: any) => {
        const { vendorIdStoreIdChannelId, ...restDbEntity } = dbEntity;
        return isEqual(restDbEntity, restNewEntity);
      }
    );

    if (foundEntityIndex === -1) {
      temporalEntitiesCleaned.push(entity);
      continue;
    }

    temporalEntitiesCleaned[foundEntityIndex].vendorIdStoreIdChannelId.push(
      ...vendorIdStoreIdChannelId
    );
    temporalEntitiesCleaned[foundEntityIndex].vendorIdStoreIdChannelId =
      temporalEntitiesCleaned[foundEntityIndex].vendorIdStoreIdChannelId.sort();
  }

  const temporalEntitiesFiltered = temporalEntitiesCleaned.filter(
    (temporalEntity: any) => temporalEntity.vendorIdStoreIdChannelId.length
  );

  return temporalEntitiesFiltered;
};
