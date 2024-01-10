import { Vendor } from "../types/vendor.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchVendor = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const vendor = await dbClient
    .collection("vendors")
    .findOne({ vendorId, "account.accountId": accountId });

  return vendor as unknown as Vendor;
};
