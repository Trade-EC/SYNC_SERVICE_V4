import _ from "/opt/nodejs/node_modules/lodash";
import { z } from "/opt/nodejs/node_modules/zod";
import { transformCategories } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformList } from "/opt/nodejs/transforms/kfcLists.transform";
import { transformProducts } from "/opt/nodejs/transforms/kfcLists.transform";

export const mergeCategories = (
  dbCategories: any,
  newCategories: any,
  vendorId: string,
  storesId: string[],
  channelId: string
) => {
  const temporalCategories = _.cloneDeep(dbCategories);
  const temporalCategoriesCleaned = temporalCategories.map(
    (temporalCategory: any) => {
      const { vendorIdStoreIdChannelId: oldIds } = temporalCategory;
      return {
        ...temporalCategory,
        vendorIdStoreIdChannelId: oldIds.filter(
          (oldId: any) =>
            !(
              oldId.vendorId === vendorId &&
              storesId.includes(oldId.storeId) &&
              oldId.channelId === channelId
            )
        )
      };
    }
  );

  for (const category of newCategories) {
    const { vendorIdStoreIdChannelId: ids, ...restNewCategory } = category;
    const foundCategoryIndex = temporalCategoriesCleaned.findIndex(
      (dbCategory: any) => {
        const { vendorIdStoreIdChannelId, ...restDbCategory } = dbCategory;
        return _.isEqual(restDbCategory, restNewCategory);
      }
    );

    if (foundCategoryIndex === -1) {
      temporalCategoriesCleaned.push(category);
      continue;
    }

    temporalCategoriesCleaned[foundCategoryIndex].vendorIdStoreIdChannelId.push(
      ...ids
    );
  }
  return temporalCategoriesCleaned;
};

export const mergeEntity = (
  dbEntities: any,
  newEntities: any,
  vendorIdStoreIdChannelId: string[]
) => {
  const temporalEntities = _.cloneDeep(dbEntities);
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

  console.log(JSON.stringify({ transformedModifierGroups }));

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

  console.log(JSON.stringify({ newModifierGroups }));

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
