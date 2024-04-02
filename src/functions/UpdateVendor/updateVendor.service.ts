import { APIGatewayProxyEvent } from "aws-lambda";

import { updateVendorPathParameterValidator } from "./updateVendor.validator";
import { updateVendorValidator } from "./updateVendor.validator";
import { updateVendorRepository } from "./updateVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { buildVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { putVendorTask } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
// @ts-ignore
import { v4 as uuidv4 } from "/opt/nodejs/sync-service-layer/node_modules/uuid";

const taskTableName = process.env.TASK_SCHEDULE_TABLE ?? "";

export const updateVendorService = async (event: APIGatewayProxyEvent) => {
  const { headers, body, pathParameters } = event;
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  const parseBody = JSON.parse(body ?? "");
  const validatedBody = updateVendorValidator.parse(parseBody);
  const { vendorId } = updateVendorPathParameterValidator.parse(
    pathParameters ?? {}
  );
  const { syncTimeUnit, syncTimeValue } = validatedBody;
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

  await updateVendorRepository(validatedBody, accountId, vendorId);
  const url = `https://${domainName}/api/v4/publish-sync`;
  if (syncTimeUnit && syncTimeValue && taskTableName) {
    const id: string = uuidv4();
    const vendorTask = await fetchVendorTask(accountId, vendorId);
    const vendorTaskBuild = await buildVendorTask(
      accountId,
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
      message: "Vendor updated successfully"
    })
  };
};
