import { APIGatewayProxyEvent } from "aws-lambda";

import { publishSyncValidator } from "./publishSync.validator";
import { transformQuestions } from "./publishSync.transform";

// import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";
import { s3Client } from "/opt/nodejs/configs/config";
import { Upload } from "/opt/nodejs/node_modules/@aws-sdk/lib-storage";

export const publishSyncService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const parsedBody = JSON.parse(body ?? "");
  // const { account: accountId } = headersValidator.parse(headers);
  const { Account: accountId } = headers;
  const info = publishSyncValidator.parse(parsedBody);
  const { vendorId } = info;
  const dbClient = await connectToDatabase();
  const stores = await dbClient
    .collection("stores")
    .find({ "vendor.id": vendorId, "account.id": accountId })
    .toArray();

  const rawProducts = await dbClient
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
            "vendor.id": "10",
            "account.accountId": "1"
          }
        }
      }
    ])
    .toArray();

  const productsPromises = rawProducts.map(async product => {
    const { questionsProducts } = product;
    const transformedQuestions = transformQuestions(
      product?.questions ?? [],
      questionsProducts,
      1
    );

    delete product.questionsProducts;
    return {
      ...product,
      questions: transformedQuestions
    };
  });

  const products = await Promise.all(productsPromises);

  const Bucket = "syncservicev4.admin.dev";
  const storesKey = `sync/${accountId}/${vendorId}/stores.json`;
  const productsKey = `sync/${accountId}/${vendorId}/products.json`;
  const storesInput = {
    Bucket,
    Key: storesKey,
    Body: Buffer.from(JSON.stringify(stores))
  };
  const productsInput = {
    Bucket,
    Key: productsKey,
    Body: Buffer.from(JSON.stringify(products))
  };
  const uploadStores = new Upload({
    client: s3Client,
    params: storesInput
  });
  const uploadProducts = new Upload({
    client: s3Client,
    params: productsInput
  });
  const responseStores = await uploadStores.done();
  const responseProducts = await uploadProducts.done();
  const { $metadata: storesMetadata } = responseStores;
  const { $metadata: productsMetadata } = responseProducts;
  if (
    storesMetadata.httpStatusCode !== 200 ||
    productsMetadata.httpStatusCode !== 200
  )
    throw new Error("Upload stores failed");

  // TODO: Ver si se consigue la URL del archivo
  const storeResponse = {
    bucket: Bucket,
    key: storesKey,
    status: "DONE"
  };

  const productResponse = {
    bucket: Bucket,
    key: productsKey,
    status: "DONE"
  };

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };

  const productsSync = fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${Bucket}&key=${productsKey}`,
    fetchOptions
  );

  const storesSync = fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${Bucket}&key=${storesKey}`,
    fetchOptions
  );

  const responses = await Promise.all([productsSync, storesSync]);
  console.log(JSON.stringify(responses));

  return {
    statusCode: 200,
    body: JSON.stringify({
      stores: storeResponse,
      products: productResponse
    })
  };
};
