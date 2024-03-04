import { transformCategories } from "./lists.transform";
import { transformList } from "./lists.transform";
import { transformProducts } from "./lists.transform";

/**
 *
 * @param modifierGroups
 * @description Transform modifier groups
 * @returns void
 */
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

export const transformKFCProducts = (lists: any) => {
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
