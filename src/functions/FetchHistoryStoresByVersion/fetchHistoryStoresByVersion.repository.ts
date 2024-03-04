import { getPaginatedData } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchHistoryStoresByVersionRepository = async (
  accountId: string,
  vendorId: string,
  version: number,
  skip: number,
  limit: number
) => {
  const filter = {
    "vendor.id": vendorId,
    "account.id": accountId,
    version
  };

  const sort = { storeId: 1 };
  return await getPaginatedData("historyStores", skip, limit, filter, sort);
};
