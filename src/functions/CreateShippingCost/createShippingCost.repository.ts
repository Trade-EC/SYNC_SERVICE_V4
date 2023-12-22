import { DBShippingCost } from "./createShippingCost.types";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const findShippingCost = async (
  shippingCostId: string,
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const shippingCost = await dbClient.collection("shippingCost").findOne({
    shippingCostId,
    "vendor.id": vendorId,
    "account.id": accountId
  });

  return shippingCost as unknown as DBShippingCost;
};

export const createOrUpdateShippingCost = async (
  shippingCost: DBShippingCost
) => {
  const dbClient = await connectToDatabase();
  const { shippingCostId, account, vendor } = shippingCost;
  const { accountId } = account;
  const { id: vendorId } = vendor;
  return await dbClient
    .collection("shippingCost")
    .updateOne(
      { shippingCostId, "vendor.id": vendorId, "account.id": accountId },
      { $set: { ...shippingCost } },
      { upsert: true }
    );
};
