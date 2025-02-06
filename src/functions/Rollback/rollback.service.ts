import { APIGatewayProxyEvent } from "aws-lambda";

import { rollbackValidator } from "./rollback.validator";

// @ts-ignore
import { v4 as uuidv4 } from "/opt/nodejs/sync-service-layer/node_modules/uuid";

const NEW_PRODUCTS_SERVICE_URL = process.env.NEW_PRODUCTS_SERVICE_URL ?? "";
const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  }
};
/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const rollbackService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const info = rollbackValidator.parse(parsedBody);
  const { vendorId, type, version } = info;

  switch (type) {
    case "STORES":
      await callPublishEP(vendorId, "STORES", uuidv4(), version);
      break;
    case "PRODUCTS":
      await callPublishEP(vendorId, "PRODUCTS", uuidv4(), version);
      break;
    default:
      throw new Error("Invalid type");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Rollback ${type} done`
    })
  };
};

const callPublishEP = async (
  vendorId: string,
  type: "STORES" | "PRODUCTS",
  publishId: string,
  version: number
) => {
  const url = `${NEW_PRODUCTS_SERVICE_URL}/api/v4/publish?publishId=${publishId}&version=${version}&vendorId=${vendorId}&type=${type.toLowerCase()}&isRollback=true`;
  const response = await fetch(url, fetchOptions);
  const { status } = response;
  if (status > 399) {
    console.error("PUBLISH: ERROR SYNCING", { status, type });
    throw new Error("Error rolling back");
  }
};
