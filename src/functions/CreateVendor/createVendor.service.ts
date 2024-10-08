import { APIGatewayProxyEvent } from "aws-lambda";

import { createVendorValidator } from "./createVendor.validator";
import { createVendorRepository } from "./createVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { buildVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { putVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
// @ts-ignore
import { v4 as uuidv4 } from "/opt/nodejs/sync-service-layer/node_modules/uuid";

const taskTableName = process.env.TASK_SCHEDULE_TABLE ?? "";

export const createVendorService = async (event: APIGatewayProxyEvent) => {
  const { headers, body } = event;
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  const parseBody = JSON.parse(body ?? "");
  const validatedBody = createVendorValidator.parse(parseBody);
  const { syncTimeUnit, syncTimeValue, vendorId } = validatedBody;
  const { requestContext } = event;
  const { domainName } = requestContext;
  let accountId = requestAccountId;
  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;

  if (!vendorId.startsWith(`${accountId}.${countryId}.`)) {
    throw new Error(
      `VendorId must start with accountId and countryId: ${accountId}.${countryId}.`
    );
  }

  await createVendorRepository(validatedBody, accountId);
  const stageName = process.env.STAGE_NAME ?? "";
  const url = `https://${domainName}/${stageName}/api/v4/publish-sync`;
  if (domainName && syncTimeUnit && syncTimeValue && taskTableName) {
    const id: string = uuidv4();
    const vendorTask = await fetchVendorTask(accountId, vendorId);
    const vendorTaskBuild = await buildVendorTask(
      accountId,
      countryId,
      vendorId,
      syncTimeUnit,
      syncTimeValue,
      url
    );
    const mergedVendorTask = { id, ...vendorTask, ...vendorTaskBuild };
    await putVendorTask(mergedVendorTask);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Vendor created successfully"
    })
  };
};
