import { z } from "zod";

import { additionalInfoValidator } from "./common.validator";
import { scheduleValidator } from "./common.validator";
import { productValidator } from "./lists.validator";

export const dbTaxValidator = z.object({
  type: z.string(),
  value: z.number()
});

// ------------------------------------------ images

export const dbImageValidator = z.object({
  bucket: z.string(),
  cloudFrontUrl: z.string(),
  key: z.string(),
  name: z.string(),
  url: z.string(),
  externalUrl: z.string().optional(),
  status: z.enum(["DONE", "PROCESSING"]).optional()
});

export const catalogueValidator = z.object({
  vendorIdStoreIdChannelId: z.array(z.string())
});

// ------------------------------------------ schedules

export const dbScheduleValidator = scheduleValidator
  .pick({ day: true, endDate: true, startDate: true })
  .extend({
    catalogueId: z.string(),
    from: z.number(),
    to: z.number()
  });

export const locationValidator = z.object({
  lat: z.number(),
  lon: z.number()
});

export const idValidator = z.object({
  id: z.string()
});

export const accountValidator = z.object({
  accountId: z.string()
});

export const dbCityValidator = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean()
});

export const statusValidator = z.enum(["DRAFT", "PUBLISHED", "ERROR"]);

export const dbServicesValidator = z.object({
  name: z.string(),
  active: z.boolean()
});

export const dbCatalogueValidator = z.object({
  catalogueId: z.string(),
  name: z.string(),
  active: z.boolean()
});

export const dbStoreValidator = z.object({
  storeId: z.string(),
  status: statusValidator,
  hash: z.string().nullable(),
  version: z.number().nullable(),
  storeName: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  description: z.string(),
  phone: z.string(),
  maxOrderAmount: z.number(),
  minOrderAmount: z.number(),
  active: z.boolean(),
  isDefault: z.boolean(),
  outOfService: z.boolean(),
  cookTime: z.number(),
  enableTips: z.boolean(),
  images: z.array(dbImageValidator.merge(catalogueValidator)),
  minOrder: z.number(),
  minOrderSymbol: z.string().nullable(),
  orderSymbol: z.string().nullable(),
  catalogues: z.array(dbCatalogueValidator),
  polygons: z.array(z.any()).nullable(),
  sponsored: z.boolean(),
  tips: z.array(z.any()).nullable(), // TODO:
  timezone: z.string().nullable(),
  schedules: z.array(dbScheduleValidator),
  location: locationValidator,
  country: idValidator.nullable(),
  vendor: idValidator,
  accounts: z.array(accountValidator),
  account: idValidator,
  city: dbCityValidator,
  taxes: dbTaxValidator.array(),
  services: z.array(dbServicesValidator),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  shippingCostId: z.string().nullable()
});

// ------------------------------------------ list

export const dbProductAttributesValidator = z.object({
  Cantidad: z.string(),
  externalId: z.string(),
  showInMenu: z.boolean()
});

const dbBaseCategoryValidator = z
  .object({
    position: z.number(),
    displayInMenu: z.enum(["YES", "NO"]),
    categoryId: z.string(),
    name: z.string(),
    images: z.array(dbImageValidator),
    schedules: z.array(dbScheduleValidator),
    additionalInfo: additionalInfoValidator,
    parentId: z.string().nullable(),
    featured: z.boolean(),
    available: z.boolean(),
    active: z.boolean(),
    standardTime: z.enum(["YES", "NO"]),
    reload: z.boolean()
  })
  .merge(catalogueValidator);

type DbCategory = z.infer<typeof dbBaseCategoryValidator> & {
  subcategories: DbCategory[];
};

export const dbCategoryValidator: z.ZodType<DbCategory> =
  dbBaseCategoryValidator.extend({
    subcategories: z.lazy(() => dbCategoryValidator.array())
  });

export const dbStatusPromotedValidator = z.object({
  isPromotionActive: z.boolean(),
  discountPercentage: z.number().nullable()
});

export const dbProductStatuses = z
  .object({
    availability: z.boolean(),
    isVisible: z.boolean(),
    maxInCart: z.number().nullable(),
    minInCart: z.number().nullable(),
    promoted: dbStatusPromotedValidator
  })
  .merge(catalogueValidator);

export const dbPriceValidator = z.object({
  category: z.enum(["NORMAL", "POINTS", "SUGGESTED", "SUGGESTED_POINTS"]),
  symbol: z.string().max(5),
  grossPrice: z.number(),
  taxes: dbTaxValidator.array(),
  netPrice: z.number(),
  discounts: z.array(z.any()),
  discountGrossPrice: z.number(),
  discountNetPrice: z.number(),
  discount: z.number()
});

export const dbAnswerAttributesValidator = z.object({
  externalId: z.string(),
  showInMenu: z.boolean(),
  answerExternalId: z.string()
});

export const dbAnswerValidator = z.object({
  productId: z.string(),
  attributes: dbAnswerAttributesValidator,
  questionId: z.string()
});

export const dbQuestionsValidator = z.object({
  questionId: z.string(),
  externalId: z.string(),
  name: z.string(),
  description: z.string(),
  min: z.number(),
  max: z.number(),
  additionalInfo: additionalInfoValidator.nullable(),
  visible: z.boolean(),
  position: z.number(),
  answers: z.array(dbAnswerValidator)
});

export const dbPricesValidator = z
  .object({
    prices: z.object({
      normal: dbPriceValidator,
      suggested: dbPriceValidator.nullable(),
      points: dbPriceValidator.nullable(),
      suggestedPoints: dbPriceValidator.nullable()
    })
  })
  .merge(catalogueValidator);

export const dbProductValidator = productValidator
  .pick({
    productId: true,
    name: true,
    description: true,
    type: true,
    upselling: true,
    tags: true
  })
  .extend({
    hash: z.string().nullable(),
    version: z.number().nullable(),
    status: statusValidator,
    measure: z.string().nullable(),
    stock: z.number().nullable(),
    manufacturer: z.array(z.any()).nullable(),
    coverUrl: z.string().nullable(),
    attributes: dbProductAttributesValidator,
    additionalInfo: additionalInfoValidator.nullable(),
    sponsored: z.boolean(),
    maxAmountForSale: z.number(),
    available: z.boolean(),
    outOfStock: z.boolean(),
    outOfService: z.boolean(),
    hasModifiers: z.boolean(),
    schedules: z.array(dbScheduleValidator.merge(catalogueValidator)),
    images: z.array(dbImageValidator.merge(catalogueValidator)),
    vendor: idValidator,
    account: accountValidator,
    standardTime: z.enum(["YES", "NO"]),
    categories: z.array(dbCategoryValidator),
    statuses: z.array(dbProductStatuses),
    prices: z.array(dbPricesValidator),
    questions: z.array(dbQuestionsValidator),
    externalData: z.string().nullable(),
    isPriceVip: z.boolean(),
    suggestedPrice: z.number()
  });

// ------------------------------------------ shippingCost

export const dbShippingCostValidator = z.object({
  shippingCostId: z.string(),
  name: z.string(),
  amount: z.number(),
  symbol: z.string(),
  vendorIdStoreIdChannelId: z.array(z.string()),
  grossPrice: z.number(),
  netPrice: z.number(),
  subtotalBeforeTaxes: z.number(),
  taxes: z.array(z.any()),
  taxTotal: z.number(),
  discounts: z.array(z.any()),
  discountTotal: z.number(),
  total: z.number(),
  account: z.object({ accountId: z.string() }),
  vendor: z.object({ id: z.string() })
});
