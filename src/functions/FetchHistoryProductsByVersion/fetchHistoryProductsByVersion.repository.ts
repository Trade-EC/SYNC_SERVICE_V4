import { getPaginatedData } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const fetchHistoryProductsByVersionRepository = async (
  accountId: string,
  vendorId: string,
  version: number,
  skip: number,
  limit: number
) => {
  const filter = {
    "vendor.id": vendorId,
    "account.accountId": accountId,
    version
  };

  const sort = { productId: 1 };
  return await getPaginatedData("historyProducts", skip, limit, filter, sort);
};
