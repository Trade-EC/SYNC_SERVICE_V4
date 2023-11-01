import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchProducts, fetchStores } from "./publishSync.repository";
import { updateStatusProducts } from "./publishSync.repository";
import { updateStatusStores } from "./publishSync.repository";
import { saveStoresInHistory } from "./publishSync.repository";
import { saveProductsInHistory } from "./publishSync.repository";
import { saveProductsInS3, saveStoresInS3 } from "./publishSync.repository";
import { transformQuestions } from "./publishSync.transform";
import { publishSyncValidator } from "./publishSync.validator";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { logger } from "/opt/nodejs/configs/observability.config";
import CONSTANTS from "/opt/nodejs/configs/constants";

const { BUCKET } = CONSTANTS.GENERAL;

export const publishSyncService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  const info = publishSyncValidator.parse(parsedBody);
  const { vendorId } = info;
  logger.appendKeys({ vendorId, accountId });
  logger.info("PUBLISH: INIT");

  if (!accountId || !vendorId) throw new Error("Missing required fields");

  logger.info("PUBLISH: FETCHING DATA");
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

  logger.info("PUBLISH: SAVING IN S3");
  const storeResponse = await saveStoresInS3(vendorId, accountId, stores);
  const { key: storesKey } = storeResponse;
  const productResponse = await saveProductsInS3(vendorId, accountId, products);
  const { key: productsKey } = productResponse;

  logger.info("PUBLISH: SYNCING");
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
  logger.info("PUBLISH: HISTORY");
  await saveStoresInHistory(vendorId, accountId);
  await saveProductsInHistory(vendorId, accountId);

  logger.info("PUBLISH: UPDATING STATUS");
  await updateStatusProducts(vendorId, accountId);
  await updateStatusStores(vendorId, accountId);

  logger.info("PUBLISH: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      stores: storeResponse,
      products: productResponse
    })
  };
};
