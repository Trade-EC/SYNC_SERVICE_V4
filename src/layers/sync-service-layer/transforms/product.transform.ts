import _ from "lodash";

import { DbCategory, DbProduct, DbQuestion } from "../types/products.types";
import { isUndefined, normalizeProductType } from "../utils/common.utils";
import { imageHandler } from "../utils/images.utils";

import { Category, ModifierGroup } from "/opt/nodejs/types/lists.types";
import { PriceInfo, TaxesInfo } from "/opt/nodejs/types/lists.types";
import { TransformProductsProps } from "/opt/nodejs/types/lists.types";
import { transformSchedules } from "/opt/nodejs/utils/schedule.utils";

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

export const transformCategory = async (
  category: Category,
  storesId: string[],
  channelId: string,
  vendorId: string,
  productId: string,
  parentId?: string
) => {
  const { name, productCategoryId, schedules, images } = category;
  const { featured, childCategories = [], productListing } = category;
  const productInCategory = productListing.find(
    listing => listing.productId === productId
  );
  const { position } = productInCategory ?? {};

  const imagesPromises = images?.map(image =>
    imageHandler(image.fileUrl, "category")
  );
  const newImages = await Promise.all(imagesPromises ?? []);

  const newCategory: DbCategory = {
    categoryId: productCategoryId,
    name,
    images: newImages,
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId)
      : [],
    // subcategories: childCategories.map(childCategory =>
    //   transformCategory(
    //     childCategory,
    //     storesId,
    //     channelId,
    //     productCategoryId,
    //     productId,
    //     parentId
    //   )
    // ),
    subcategories: [],
    parentId: parentId ? parentId : "",
    standardTime: schedules ? "YES" : "NO",
    reload: false,
    additionalInfo: {
      externalId: productCategoryId
    },
    featured: featured ? featured : false,
    available: true,
    active: true,
    position: position ? position : 0,
    displayInMenu: "YES",
    vendorIdStoreIdChannelId: storesId.map(
      storeId => `${vendorId}#${storeId}#${channelId}`
    )
  };
  return newCategory;
};

const getTaxesAndGrossPrice = (
  price: number,
  taxesInfo: TaxesInfo | undefined
) => {
  const { taxRate, vatRatePercentage } = taxesInfo ?? {};
  const taxes = [];
  let vat = 0;
  if (vatRatePercentage) {
    taxes.push({
      name: "IVA",
      percentage: vatRatePercentage
    });
    vat += vatRatePercentage;
  }
  if (taxRate) {
    taxes.push({
      name: "OTHER",
      percentage: taxRate
    });
    vat += taxRate;
  }
  const grossPrice = price * (vat / 100 + 1);

  return { grossPrice, taxes };
};

export const transformPrices = (
  priceInfo: PriceInfo,
  taxesInfo: TaxesInfo | undefined
) => {
  const { price, pointPrice, suggestedPointPrice, suggestedPrice } = priceInfo;
  const productPrice: any = {};

  const normal = {
    category: "NORMAL",
    symbol: "",
    netPrice: price,
    ...getTaxesAndGrossPrice(price, taxesInfo),
    discounts: [], // php -> No existe
    discountGrossPrice: 0, // php -> No existe
    discountNetPrice: 0, // php -> No existe
    discount: 0 // php -> No existe
  };

  const points = {
    category: "POINTS",
    symbol: "",
    netPrice: pointPrice ?? 0,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  const suggested = {
    category: "SUGGESTED",
    symbol: "",
    netPrice: suggestedPrice ?? 0,
    ...getTaxesAndGrossPrice(suggestedPrice ?? 0, taxesInfo),
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  const suggestedPoints = {
    category: "SUGGESTED_POINTS",
    symbol: "",
    netPrice: suggestedPointPrice ?? 0,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  productPrice["NORMAL"] = normal;
  productPrice["POINTS"] = !isUndefined(pointPrice) ? points : null;
  productPrice["SUGGESTED"] = !isUndefined(suggestedPrice) ? suggested : null;
  productPrice["SUGGESTED_POINTS"] = !isUndefined(suggestedPoints)
    ? suggestedPoints
    : null;

  return productPrice;
};

export const transformModifierGroup = (modifierGroup: ModifierGroup) => {
  const { modifier, modifierId, maxOptions } = modifierGroup;
  const { minOptions } = modifierGroup; // type is not using

  const question = {
    questionId: modifierId,
    externalId: modifierId,
    name: modifier,
    description: "",
    min: minOptions,
    max: maxOptions,
    additionalInfo: null,
    visible: true
  };
  return question;
};

export const transformProduct = async (props: TransformProductsProps) => {
  const { product, channelId, storesId, vendorId, modifierGroups } = props;
  const { categories, accountId } = props;
  const { productId, name, description, type, featured } = product;
  const { tags, additionalInfo, standardTime, schedules } = product;
  const { priceInfo, taxInfo, productModifiers, upselling } = product;
  const { images } = product;
  const { suggestedPrice } = priceInfo;

  // @ts-ignore filter check if modifier exists
  const questions: DbQuestion[] = productModifiers
    ?.map(productModifier => {
      let productModifierId = "";
      if (typeof productModifier === "string") {
        productModifierId = productModifier;
      } else {
        productModifierId = productModifier.modifierId;
      }
      const modifierGroup = modifierGroups.find(
        modifierGroup =>
          modifierGroup.modifierId.toString() === productModifierId.toString()
      );
      if (!modifierGroup) return undefined;
      const syncModifiers: any = modifierGroup?.modifierOptions
        .map(modifier => {
          const { productId, optionId } = modifier;
          // TODO: Ver si esto es necesario
          // const modifierProduct = products.find(
          //   product => product.productId === productId
          // );
          // if (!modifierProduct) return null;

          return {
            productId,
            attributes: {
              externalId: productId,
              showInMenu: true,
              answerExternalId: optionId
            },
            questionId: modifierGroup.modifierId
          };
        })
        .filter(modifier => !!modifier);

      const question: DbQuestion = {
        ...transformModifierGroup(modifierGroup),
        position: 0,
        answers: syncModifiers
      };
      return question;
    })
    ?.filter(modifier => !!modifier);
  const imagesPromises = images?.map(image =>
    imageHandler(image.fileUrl, "product")
  );
  const newImages = await Promise.all(imagesPromises ?? []);

  const syncCategories = await transformCategoriesByProduct(
    categories,
    productId,
    storesId,
    channelId,
    vendorId
  );

  const newProduct: DbProduct = {
    productId: `${accountId}#${productId}`,
    status: "DRAFT",
    version: "2023-10-06-1",
    name,
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
        vendorIdStoreIdChannelId: storesId.map(
          storeId => `${vendorId}#${storeId}#${channelId}`
        ),
        ...image
      })) ?? [],
    additionalInfo: additionalInfo ? additionalInfo : null,
    tags: tags ? tags : [],
    prices: [
      {
        vendorIdStoreIdChannelId: storesId.map(
          storeId => `${vendorId}#${storeId}#${channelId}`
        ),
        prices: transformPrices(priceInfo, taxInfo)
      }
    ],
    categories: syncCategories,
    externalData: null, // No se encontró en el PHP
    isPriceVip: false,
    outOfService: false,
    outOfStock: false,
    sponsored: !featured ? true : featured,
    suggestedPrice: suggestedPrice ? +suggestedPrice.toPrecision(2) : 0,
    maxAmountForSale: 0,
    statuses: [
      {
        vendorIdStoreIdChannelId: storesId.map(
          storeId => `${vendorId}#${storeId}#${channelId}`
        ),
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
          vendorIdStoreIdChannelId: storesId.map(
            storeId => `${vendorId}#${storeId}#${channelId}`
          ),
          ...question
        };
      }) ?? [],
    hasModifiers: questions?.length ? true : false,
    upselling: upselling ? upselling : [],
    standardTime: standardTime || schedules ? "YES" : "NO", // Si me llegan schedules standardTime YES si no NO
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId).map(schedule => ({
          vendorIdStoreIdChannelId: storesId.map(
            storeId => `${vendorId}#${storeId}#${channelId}`
          ),
          ...schedule
        }))
      : [],
    vendor: {
      id: vendorId
    },
    account: {
      accountId
    }
  };

  return newProduct;
};

export const mergeEntity = (
  dbEntities: any,
  newEntities: any,
  vendorIdStoreIdChannelId: string[]
) => {
  const temporalEntities = _.cloneDeep(dbEntities);
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
    const foundPriceIndex = temporalEntitiesCleaned.findIndex(
      (dbEntity: any) => {
        const { vendorIdStoreIdChannelId, ...restDbEntity } = dbEntity;
        return _.isEqual(restDbEntity, restNewEntity);
      }
    );

    if (foundPriceIndex === -1) {
      temporalEntitiesCleaned.push(entity);
      continue;
    }

    temporalEntitiesCleaned[foundPriceIndex].vendorIdStoreIdChannelId.push(
      ...vendorIdStoreIdChannelId
    );
  }

  return temporalEntitiesCleaned;
};