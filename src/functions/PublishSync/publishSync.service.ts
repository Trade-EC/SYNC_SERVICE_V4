import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchProducts, fetchStores } from "./publishSync.repository";
import { updateStatus, saveStoresInHistory } from "./publishSync.repository";
import { saveProductsInHistory } from "./publishSync.repository";
import { saveProductsInS3, saveStoresInS3 } from "./publishSync.repository";
import { transformQuestions } from "./publishSync.transform";
import { publishSyncValidator } from "./publishSync.validator";

// import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { logger } from "/opt/nodejs/configs/observability.config";
import CONSTANTS from "/opt/nodejs/configs/constants";

const { BUCKET } = CONSTANTS.GENERAL;

export const publishSyncService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  // const { account: accountId } = headersValidator.parse(headers);
  const { Account: accountId } = headers;
  const info = publishSyncValidator.parse(parsedBody);
  const { vendorId } = info;
  logger.appendKeys({ vendorId, accountId });
  logger.info("Publish sync initiating");

  if (!accountId || !vendorId) throw new Error("Missing required fields");

  logger.info("Collecting stores and products");
  const stores = await fetchStores(vendorId, accountId);
  const rawProducts = await fetchProducts(vendorId, accountId);

  const products = rawProducts.map(product => {
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

  logger.info("Storing data in S3");
  const storeResponse = await saveStoresInS3(vendorId, accountId, stores);
  const { key: storesKey } = storeResponse;
  const productResponse = await saveProductsInS3(vendorId, accountId, products);
  const { key: productsKey } = productResponse;

  logger.info("Send info to admin");
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  };
  const productsSync = fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${BUCKET}&key=${productsKey}`,
    fetchOptions
  );

  const storesSync = fetch(
    `https://v9ti364z21.execute-api.us-east-2.amazonaws.com/Dev/publish?bucket=${BUCKET}&key=${storesKey}`,
    fetchOptions
  );

  await Promise.all([productsSync, storesSync]);
  logger.info("Saving in history");
  await saveStoresInHistory(vendorId, accountId);
  await saveProductsInHistory(vendorId, accountId);

  logger.info("Switch to publish");
  await updateStatus(vendorId, accountId, "products");
  await updateStatus(vendorId, accountId, "stores");

  logger.info("Publish sync finished");
  return {
    statusCode: 200,
    body: JSON.stringify({
      stores: storeResponse,
      products: productResponse
    })
  };
};
