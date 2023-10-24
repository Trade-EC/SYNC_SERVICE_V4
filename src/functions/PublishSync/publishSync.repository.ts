import { WithId, Document } from "/opt/nodejs/node_modules/mongodb/mongodb";
import CONSTANTS from "/opt/nodejs/configs/constants";
import { s3Client } from "/opt/nodejs/configs/config";
import { Upload } from "/opt/nodejs/node_modules/@aws-sdk/lib-storage";
import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

const { BUCKET } = CONSTANTS.GENERAL;

export const saveProductsInHistory = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .aggregate([
      {
        $match: {
          "vendor.id": vendorId,
          "account.id": accountId,
          status: "DRAFT"
        }
      },
      { $addFields: { status: "PUBLISHED", deleted_at: new Date() } },
      { $project: { _id: 0 } },
      { $merge: { into: "historyStores" } }
    ])
    .toArray();

  return response;
};

export const saveStoresInHistory = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("products")
    .aggregate([
      {
        $match: {
          "vendor.id": vendorId,
          "account.accountId": accountId,
          status: "DRAFT"
        }
      },
      { $addFields: { status: "PUBLISHED", deleted_at: new Date() } },
      { $project: { _id: 0 } },
      { $merge: { into: "historyProducts" } }
    ])
    .toArray();

  return response;
};

export const fetchStores = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .find({ "vendor.id": vendorId, "account.id": accountId })
    .toArray();

  return response;
};

export const fetchProducts = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const response = dbClient
    .collection("products")
    .aggregate([
      {
        $graphLookup: {
          from: "products",
          startWith: "$attributes.externalId",
          connectFromField: "questions.answers.productId",
          connectToField: "attributes.externalId",
          as: "questionsProducts",
          maxDepth: 2,
          restrictSearchWithMatch: {
            "vendor.id": vendorId,
            "account.accountId": accountId
          }
        }
      }
    ])
    .toArray();

  return response;
};

export const saveStoresInS3 = async (
  vendorId: string,
  accountId: string,
  stores: WithId<Document>[]
) => {
  const storesKey = `sync/${accountId}/${vendorId}/stores.json`;
  const storesInput = {
    Bucket: BUCKET,
    Key: storesKey,
    Body: Buffer.from(JSON.stringify(stores))
  };
  const uploadStores = new Upload({
    client: s3Client,
    params: storesInput
  });
  const responseStores = await uploadStores.done();
  const { $metadata: metadata } = responseStores;
  const { httpStatusCode } = metadata;
  if (httpStatusCode !== 200) throw new Error("Upload stores failed");
  return {
    bucket: BUCKET,
    key: storesKey,
    status: "DONE"
  };
};

export const saveProductsInS3 = async (
  vendorId: string,
  accountId: string,
  products: any
) => {
  const productsKey = `sync/${accountId}/${vendorId}/products.json`;

  const productsInput = {
    Bucket: BUCKET,
    Key: productsKey,
    Body: Buffer.from(JSON.stringify(products))
  };

  const uploadProducts = new Upload({
    client: s3Client,
    params: productsInput
  });

  const responseProducts = await uploadProducts.done();

  const { $metadata: productsMetadata } = responseProducts;
  if (productsMetadata.httpStatusCode !== 200)
    throw new Error("Upload stores failed");

  return {
    Bucket: BUCKET,
    key: productsKey,
    status: "DONE"
  };
};

export const updateStatus = async (
  vendorId: string,
  accountId: string,
  collection: "products" | "stores"
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection(collection)
    .updateMany(
      { "vendor.id": vendorId, "account.id": accountId, status: "DRAFT" },
      { $set: { status: "PUBLISHED" } }
    );

  return response;
};
