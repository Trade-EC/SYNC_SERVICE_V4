import { Document } from "/opt/nodejs/sync-service-layer/node_modules/mongodb/mongodb";
import { WithId } from "/opt/nodejs/sync-service-layer/node_modules/mongodb/mongodb";
import CONSTANTS from "/opt/nodejs/sync-service-layer/configs/constants";
import { s3Client } from "/opt/nodejs/sync-service-layer/configs/config";
import { Upload } from "/opt/nodejs/sync-service-layer/node_modules/@aws-sdk/lib-storage";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const { BUCKET } = CONSTANTS.GENERAL;

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveStoresInHistory = async (
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
      { $addFields: { status: "DELETED", deleted_at: new Date() } },
      { $project: { _id: 0 } },
      { $merge: { into: "historyStores" } }
    ])
    .toArray();

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save stores in history collection
 * @returns void
 */
export const saveProductsInHistory = async (
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
      { $addFields: { status: "DELETED", deleted_at: new Date() } },
      { $project: { _id: 0 } },
      { $merge: { into: "historyProducts" } }
    ])
    .toArray();

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Save publish request in publishRequest collection
 * @returns void
 */
export const savePublishRequest = async (
  vendorId: string,
  accountId: string,
  type: "STORES" | "PRODUCTS"
) => {
  const dbClient = await connectToDatabase();
  return await dbClient.collection("publishRequest").insertOne({
    vendorId,
    accountId,
    status: "PENDING",
    createdAt: new Date(),
    type
  });
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Fetch stores by vendorId, accountId and status DRAFT
 * @returns DBStore[]
 */
export const fetchStores = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .find({ "vendor.id": vendorId, "account.id": accountId, status: "DRAFT" })
    .toArray();

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Fetch products by vendorId, accountId and status DRAFT
 * @returns DBStore[]
 */
export const fetchProducts = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const response = dbClient
    .collection("products")
    .aggregate([
      {
        $match: {
          "vendor.id": vendorId,
          "account.accountId": accountId,
          status: "DRAFT"
        }
      },
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

/**
 *
 * @param vendorId
 * @param accountId
 * @param stores
 * @description Save stores in S3
 * @returns void
 */
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

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status stores in stores collection
 * @returns void
 */
export const updateStatusStores = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .updateMany(
      { "vendor.id": vendorId, "account.id": accountId, status: "DRAFT" },
      { $set: { status: "PUBLISHED" } }
    );

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Update status products in products collection
 * @returns void
 */
export const updateStatusProducts = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient.collection("products").updateMany(
    {
      "vendor.id": vendorId,
      "account.accountId": accountId,
      status: "DRAFT"
    },
    { $set: { status: "PUBLISHED" } }
  );

  return response;
};
