import { CreateVendorPayload } from "./createVendor.types";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const createVendorRepository = async (
  payload: CreateVendorPayload,
  accountId: string
) => {
  const { vendorId } = payload;
  const dbClient = await connectToDatabase();
  const createdProduct = dbClient
    .collection("vendors")
    .insertOne({ "account.accountId": accountId, vendorId, channels: [] });

  return createdProduct;
};
