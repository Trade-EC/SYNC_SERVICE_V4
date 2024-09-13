import { Document } from "/opt/nodejs/sync-service-layer/node_modules/mongodb/mongodb";
import { WithId } from "/opt/nodejs/sync-service-layer/node_modules/mongodb/mongodb";
import { s3Client } from "/opt/nodejs/sync-service-layer/configs/config";
import { Upload } from "/opt/nodejs/sync-service-layer/node_modules/@aws-sdk/lib-storage";
import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const SYNC_BUCKET = process.env.SYNC_BUCKET_SYNC ?? "";

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
  type: "STORES" | "PRODUCTS",
  publishId: string
) => {
  const dbClient = await connectToDatabase();
  return await dbClient.collection("publishRequest").insertOne({
    vendorId,
    accountId,
    status: "PENDING",
    createdAt: new Date(
      new Date().toLocaleString("en", { timeZone: "America/Guayaquil" })
    ),
    type,
    publishId
  });
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Fetch stores by vendorId, accountId and status DRAFT
 * @returns DBStore[]
 */
export const fetchStores = async (
  vendorId: string,
  accountId: string,
  all: boolean
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("stores")
    .find(
      {
        "vendor.id": vendorId,
        "account.id": accountId,
        status: !all ? "DRAFT" : undefined
      },
      { ignoreUndefined: true }
    )
    .toArray();

  return response;
};

export const findShippingCost = async (vendorId: string, accountId: string) => {
  const dbClient = await connectToDatabase();
  const shippingCost = await dbClient
    .collection("shippingCost")
    .find({ "vendor.id": vendorId, "account.accountId": accountId })
    .toArray();

  return shippingCost;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @description Fetch products by vendorId, accountId and status DRAFT
 * @returns DBStore[]
 */
export const fetchProducts = async (
  vendorId: string,
  accountId: string,
  version: number,
  all: boolean
) => {
  const dbClient = await connectToDatabase();
  const response = await dbClient
    .collection("products")
    .aggregate(
      [
        {
          $match: {
            "vendor.id": vendorId,
            "account.accountId": accountId,
            status: !all ? "DRAFT" : undefined
          }
        },
        { $set: { version } },
        {
          $graphLookup: {
            from: "products",
            startWith: "$attributes.externalId",
            connectFromField: "upselling",
            connectToField: "attributes.externalId",
            as: "upsellingProducts",
            maxDepth: 2,
            restrictSearchWithMatch: {
              "vendor.id": vendorId,
              "account.accountId": accountId
            }
          }
        },
        {
          $graphLookup: {
            from: "products",
            startWith: "$attributes.externalId",
            connectFromField: "questions.answers.attributes.externalId",
            connectToField: "attributes.externalId",
            as: "questionsProducts",
            maxDepth: 2,
            restrictSearchWithMatch: {
              "vendor.id": vendorId,
              "account.accountId": accountId
            }
          }
        }
      ],
      { ignoreUndefined: true }
    )
    .toArray();

  return response;
};

/**
 *
 * @param vendorId
 * @param accountId
 * @param documents
 * @description Save documents in S3
 * @returns void
 */
export const saveDocumentsInS3 = async (
  documents: WithId<Document>[],
  s3Url: string
) => {
  const documentInput = {
    Bucket: SYNC_BUCKET,
    Key: s3Url,
    Body: Buffer.from(JSON.stringify(documents))
  };
  const uploadDocuments = new Upload({
    client: s3Client,
    params: documentInput
  });
  const responseDocuments = await uploadDocuments.done();
  const { $metadata: metadata } = responseDocuments;
  const { httpStatusCode } = metadata;
  if (httpStatusCode !== 200) throw new Error("Upload stores failed");
  return {
    bucket: SYNC_BUCKET,
    key: s3Url,
    status: "DONE"
  };
};

export const setDraftStatusForQuestionsParentsProducts = async (
  vendorId: string,
  accountId: string
) => {
  const dbClient = await connectToDatabase();
  const draftProducts = await dbClient
    .collection("products")
    .find(
      {
        "vendor.id": vendorId,
        "account.accountId": accountId
      },
      { projection: { productId: 1 } }
    )
    .toArray();

  const draftProductsIds = draftProducts.map(product => product.productId);

  await dbClient.collection("products").updateMany(
    {
      "vendor.id": vendorId,
      "account.accountId": accountId,
      "questions.answers.productId": { $in: draftProductsIds }
    },
    {
      $set: { status: "DRAFT" }
    }
  );
};
