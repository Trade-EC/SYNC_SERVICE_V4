import { UpdateVendorPayload } from "./updateVendor.types";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

export const updateVendorRepository = async (
  payload: UpdateVendorPayload,
  accountId: string,
  vendorId: string
) => {
  const filters = { "account.accountId": accountId, vendorId };
  const dbClient = await connectToDatabase();
  const createdProduct = dbClient
    .collection("vendors")
    .updateOne(filters, { $set: payload });

  return createdProduct;
};
