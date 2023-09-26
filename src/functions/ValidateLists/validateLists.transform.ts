import { z } from "/opt/nodejs/node_modules/zod";
import { transformCategories } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformModifierGroups } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformList } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformProducts } from "/opt/nodejs/transforms/kfcLists.transform";

export const transformKFCList = <T extends z.Schema<any, any>>(
  lists: any,
  validator: T
) => {
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

  const validationResult = validator.safeParse(transformedLists);
  if (!validationResult.success) {
    throw new Error(validationResult.error.message);
  }

  return transformedLists;
};
