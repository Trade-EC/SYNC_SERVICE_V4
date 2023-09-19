import { isUndefined } from "../utils/common.utils";

import { Category, ModifierGroup } from "/opt/nodejs/types/lists.types";
import { PriceInfo, TaxesInfo } from "/opt/nodejs/types/lists.types";
import { TransformProductsProps } from "/opt/nodejs/types/lists.types";
import { transformSchedules } from "/opt/nodejs/utils/schedule.utils";

export const transformCategoriesByProduct = (
  categories: Category[],
  productId: string,
  storesId: string[],
  channelId: string,
  vendorId: string
) => {
  const categoriesByProduct = categories.filter(category =>
    category.productListing.some(listing => listing.productId === productId)
  );

  return categoriesByProduct.map(category =>
    transformCategory(category, storesId, channelId, vendorId, productId)
  );
};

export const transformCategory = (
  category: Category,
  storesId: string[],
  channelId: string,
  vendorId: string,
  productId: string
  // parentId?: string
) => {
  const { name, productCategoryId, schedules } = category;
  const { featured, childCategories = [], productListing } = category;
  const productInCategory = productListing.find(
    listing => listing.productId === productId
  );
  const { position } = productInCategory ?? {};

  const newCategory = {
    categoryId: productCategoryId,
    name,
    // images Se va a hacer sincro de imagenes ??
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId)
      : [],
    // subcategories: childCategories.map(childCategory =>
    //   transformCategory(childCategory, storeId, channelId, productCategoryId)
    // ),
    // parentId,
    standardTime: schedules ? "YES" : "NO",
    reload: false,
    additionalInfo: {
      externalId: productCategoryId
    },
    featured: !isUndefined(featured) ? featured : null,
    available: true,
    subcategories: !!childCategories.length,
    active: true,
    vendorIdStoreIdChannelId: storesId.map(storeId => ({
      vendorId,
      storeId,
      channelId,
      position: !isUndefined(position) ? position : null,
      displayInMenu: "YES"
    }))
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

export const transformProduct = (props: TransformProductsProps) => {
  const { product, channelId, storesId, vendorId, modifierGroups } = props;
  const { products, categories } = props;
  const { productId, name, description, type, featured } = product;
  const { tags, additionalInfo, standardTime, schedules } = product;
  const { priceInfo, taxInfo, productModifiers, upselling } = product;
  const { suggestedPrice } = priceInfo;

  const questions = productModifiers
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
      if (!modifierGroup) return null;
      const syncModifiers: any = modifierGroup?.modifierOptions
        .map(modifier => {
          const { productId, optionId } = modifier;
          const modifierProduct = products.find(
            product => product.productId === productId
          );
          if (!modifierProduct) return null;

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

      return {
        ...transformModifierGroup(modifierGroup),
        answers: syncModifiers
      };
    })
    .filter(modifier => !!modifier);

  const syncCategories = transformCategoriesByProduct(
    categories,
    productId,
    storesId,
    channelId,
    vendorId
  );

  const newProduct = {
    productId,
    status: "DRAFT",
    version: "2023-07-01-1",
    name,
    description,
    type,
    measure: null,
    stock: null,
    manufacturer: null,
    coverUrl: null, // Vendor images
    attributes: {
      Cantidad: "1",
      externalId: productId,
      showInMenu: true
    },
    additionalInfo: !isUndefined(additionalInfo) ? additionalInfo : null,
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
    sponsored: !isUndefined(featured) ? featured : null,
    suggestedPrice: suggestedPrice ? suggestedPrice.toPrecision(2) : 0,
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
    // images: Se va a hacer sincro de imagenes Si.
    questions:
      questions?.map(question => ({
        vendorIdStoreIdChannelId: storesId.map(
          storeId => `${vendorId}#${storeId}#${channelId}`
        ),
        ...question
      })) ?? [],
    upselling: upselling ? upselling : [],
    standardTime: standardTime || schedules ? "YES" : "NO", // Si me llegan schedules standardTime YES si no NO
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId).map(schedule => ({
          vendorIdStoreIdChannelId: storesId.map(
            storeId => `${vendorId}#${storeId}#${channelId}`
          ),
          ...schedule
        }))
      : []
  };

  return newProduct;
};
