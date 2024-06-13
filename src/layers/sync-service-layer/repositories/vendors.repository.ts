import { PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { dynamoDBClient } from "../configs/config";
import { Vendor } from "../types/vendor.types";
import { connectToDatabase } from "../utils/mongo.utils";

export const fetchVendor = async (
  vendorId: string,
  accountId: string,
  countryId: string
) => {
  const dbClient = await connectToDatabase();
  const vendor = await dbClient.collection("vendors").findOne({
    externalId: vendorId,
    "account.accountId": accountId,
    countryId
  });

  return vendor as unknown as Vendor;
};

export const fetchVendorTask = async (accountId: string, vendorId: string) => {
  const input: QueryCommandInput = {
    TableName: process.env.TASK_SCHEDULE_TABLE ?? "",
    IndexName: "byVendor",
    KeyConditionExpression: "vendorId = :vendorId",
    FilterExpression: "accountId = :accountId",
    ExpressionAttributeValues: {
      ":accountId": { S: accountId },
      ":vendorId": { S: vendorId }
    }
  };

  const vendorTask = await dynamoDBClient.send(new QueryCommand(input));

  if (!vendorTask.Items?.[0]) return undefined;

  return unmarshall(vendorTask?.Items[0]);
};

export const putVendorTask = async (vendorTask: Record<string, any>) => {
  const input = {
    TableName: process.env.TASK_SCHEDULE_TABLE ?? "",
    Item: marshall(vendorTask)
  };

  await dynamoDBClient.send(new PutItemCommand(input));
};

export const buildVendorTask = async (
  accountId: string,
  countryId: string,
  vendorId: string,
  syncTimeUnit: "EVERYDAY" | "HOURS",
  syncTimeValue: string | number,
  url: string
) => {
  let schedule;
  if (syncTimeUnit === "EVERYDAY") {
    schedule = {
      days: syncTimeUnit,
      hour: syncTimeValue
    };
  } else {
    schedule = {
      interval: syncTimeUnit,
      intervalValue: syncTimeValue
    };
  }

  return {
    accountId,
    vendorId,
    ...schedule,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    httpMethod: "POST",
    headers: { account: accountId, country: countryId },
    requestUrl: url,
    requestBody: { vendorId },
    status: "PENDING"
  };
};

export const fetchMapAccount = async (accountId: string) => {
  if (!process.env.NEW_PRODUCTS_SERVICE_URL) return undefined;
  const url = `${process.env.NEW_PRODUCTS_SERVICE_URL}/api/v4/migration-data?oldId=${accountId}&type=ACCOUNT`;
  const fetchAccountResponse = await fetch(url);
  const fetchAccount = await fetchAccountResponse.json();
  if (!fetchAccount) return undefined;
  const { newId } = fetchAccount;
  return newId;
};

export const fetchVendorById = async (vendorId: string) => {
  const dbClient = await connectToDatabase();
  const vendor = await dbClient.collection("vendors").findOne({
    vendorId
  });

  return vendor as unknown as Vendor;
};
