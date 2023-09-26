import _ from "/opt/nodejs/node_modules/lodash";

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
