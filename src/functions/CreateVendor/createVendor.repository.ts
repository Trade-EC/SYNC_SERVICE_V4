import { CreateVendorPayload } from "./createVendor.types";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const createVendorRepository = async (
  payload: CreateVendorPayload,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const createdProduct = dbClient.collection("vendors").insertOne({
    account: { accountId },
    channels: [],
    ...payload
  });

  return createdProduct;
};
