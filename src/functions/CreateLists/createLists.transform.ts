import { Category, ModifierGroup } from "./createLists.types";
import { TransformProductsProps } from "./createLists.types";
import { PriceInfo, TaxesInfo } from "./createLists.types";

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
    transformCategory(category, storesId, channelId, vendorId)
  );
};

export const transformCategory = (
  category: Category,
  storesId: string[],
  channelId: string,
  vendorId: string
  // parentId?: string
) => {
  const { name, productCategoryId, schedules } = category;
  const { featured, childCategories = [], position } = category;

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
    featured,
    available: true,
    subcategories: !!childCategories.length,
    active: true,
    "vendorId#storeId#channelId": storesId.map(storeId => ({
      vendorId,
      storeId,
      channelId,
      position,
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
    netPrice: pointPrice,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  const suggested = {
    category: "SUGGESTED",
    symbol: "",
    netPrice: suggestedPrice,
    ...getTaxesAndGrossPrice(suggestedPrice ?? 0, taxesInfo),
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  const suggestedPoints = {
    category: "SUGGESTED_POINTS",
    symbol: "",
    netPrice: suggestedPointPrice,
    discounts: [],
    discountGrossPrice: 0,
    discountNetPrice: 0,
    discount: 0
  };

  productPrice["NORMAL"] = normal;
  productPrice["POINTS"] = pointPrice ? points : undefined;
  productPrice["SUGGESTED"] = suggestedPrice ? suggested : undefined;
  productPrice["SUGGESTED_POINTS"] = suggestedPoints;

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
    max: maxOptions
    // additionalInfo: {} No existe null -> php
    // visible No existe php
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
            ...transformProduct({
              product: modifierProduct,
              storesId,
              channelId,
              vendorId,
              products,
              modifierGroups,
              categories
            }),
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

  const syncUpselling: any = upselling
    ?.map(productId => {
      const foundProduct = products.find(
        product => productId.toString() === product.productId.toString()
      );
      if (!foundProduct) return undefined;
      return transformProduct({
        product: foundProduct,
        storesId,
        channelId,
        vendorId,
        products,
        modifierGroups,
        categories
      });
    })
    .filter(product => !!product);

  const syncCategories = transformCategoriesByProduct(
    categories,
    productId,
    storesId,
    channelId,
    vendorId
  );

  const newProduct = {
    productId,
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
    additionalInfo,
    tags,
    prices: transformPrices(priceInfo, taxInfo),
    categories: syncCategories,
    externalData: null, // No se encontró en el PHP
    isPriceVip: false,
    outOfService: false,
    outOfStock: false,
    sponsored: featured,
    suggestedPrice: suggestedPrice ? suggestedPrice.toPrecision(2) : 0,
    maxAmountForSale: 0,
    status: [
      {
        "vendorId#storeId#channelId": storesId.map(storeId => [
          `${vendorId}#${storeId}#${channelId}`
        ]),
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
    questions,
    upselling: syncUpselling,
    standardTime: standardTime || schedules ? "YES" : "NO", // Si me llegan schedules standardTime YES si no NO
    schedules: schedules
      ? transformSchedules(schedules, storesId, channelId)
      : []
  };

  return newProduct;
};
