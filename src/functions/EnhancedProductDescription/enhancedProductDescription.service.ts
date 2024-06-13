import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchVendorById } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
// @ts-ignore
import { chunk } from "/opt/nodejs/sync-service-layer/node_modules/lodash";

import { buildProductDescriptionForOpenAI } from "./enhancedProductDescription.helpers";
import { addAiDescriptionRecords } from "./enhancedProductDescription.repository";
import { fetchProductsByVendor } from "./enhancedProductDescription.repository";
import {
  ProductDescription,
  ProductForAi
} from "./enhancedProductDescription.types";
import { enhancedProductDescriptionValidator } from "./enhancedProductDescription.validator";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const enhancedProductDescriptionService = async (
  event: APIGatewayProxyEvent
) => {
  const { headers, body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  let accountId = requestAccountId;
  const info = enhancedProductDescriptionValidator.parse(parsedBody);
  const { vendorId } = info;
  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;

  if (!vendorId.startsWith(`${accountId}.${countryId}`)) {
    throw new Error("Vendor not match");
  }
  const vendor = await fetchVendorById(vendorId);
  const products = await fetchProductsByVendor(accountId, vendorId);
  const chunks: ProductForAi[][] = chunk(products, 50);
  const enhancedDescriptions: ProductDescription[] = [];

  for (const chunk of chunks) {
    const enhancedDescriptionsPromises = chunk.map(async product => {
      return buildProductDescriptionForOpenAI(product, vendor);
    });
    const enhancedDescriptionsChunk = await Promise.all(
      enhancedDescriptionsPromises
    );
    enhancedDescriptions.push(...enhancedDescriptionsChunk);
    await new Promise(resolve => setTimeout(resolve, 31000));
  }

  await addAiDescriptionRecords(enhancedDescriptions);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Publish sync process started"
    })
  };
};
