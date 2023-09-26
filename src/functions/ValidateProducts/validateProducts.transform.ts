import { z } from "/opt/nodejs/node_modules/zod";
import { transformList } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformProducts } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformCategories } from "/opt/nodejs/transforms/kfcLists.transform";

export const transformModifierGroups = (modifierGroups: any[]) => {
  const transformedModifierGroups = modifierGroups?.map(modifierGroup => {
    const { name, type, modifier, optionId, position } = modifierGroup;
    const { productId, maxOptions, minOptions, modifierId } = modifierGroup;

    return {
      type,
      modifier,
      maxOptions,
      minOptions,
      modifierId: String(modifierId),
      modifierOptions: [
        {
          name,
          optionId: String(optionId),
          position,
          productId: String(productId)
        }
      ]
    };
  });

  const newModifierGroups: any[] = [];

  transformedModifierGroups?.forEach(modifierGroup => {
    const foundModifierGroupIndex = newModifierGroups.findIndex(
      newModifierGroup =>
        newModifierGroup.modifierId === modifierGroup.modifierId
    );

    if (foundModifierGroupIndex === -1) {
      newModifierGroups.push(modifierGroup);
      return;
    }

    newModifierGroups[foundModifierGroupIndex].modifierOptions.push(
      ...modifierGroup.modifierOptions
    );
  });

  return newModifierGroups;
};

export const transformKFCProducts = <T extends z.Schema<any, any>>(
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
