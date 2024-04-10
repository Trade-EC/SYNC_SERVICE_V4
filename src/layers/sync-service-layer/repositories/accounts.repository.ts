import { Account } from "../types/account.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchAccount = async (accountId: string) => {
  const dbClient = await connectToDatabase();
  const account = await dbClient.collection("accounts").findOne({ accountId });

  return account as unknown as Account;
};
