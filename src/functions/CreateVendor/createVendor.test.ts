import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";
import { buildVendor } from "../../builders/vendors/vendors.builders";
import { createVendorValidator } from "./createVendor.validator";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("createVendorService verifies successful response", async () => {
    const vendor = buildVendor();
    const { account } = vendor;
    const { accountId } = account;
    const ctx = context();
    ctx.done();
    const dbClient = await connectToDatabase();
    const spy = jest.spyOn(dbClient, "collection");
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(vendor),
      headers: { account: accountId }
    };

    const response = await lambdaHandler(event, ctx);

    expect(spy).toBeCalledWith("vendors");
    expect(response.statusCode).toEqual(200);
  });
  it("createVendorService verifies params error response", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: "" }
    };

    const response = await lambdaHandler(event, ctx);

    expect(response.statusCode).toEqual(500);
  });
});

describe("createVendorValidator", () => {
  it("should omit account and channels fields when syncTimeUnit is HOURS", () => {
    const vendor = {
      vendorId: "123",
      account: { accountId: "456" },
      active: true,
      name: "Test Vendor",
      syncTimeUnit: "HOURS",
      syncTimeValue: 12,
      channels: ["channel1", "channel2"]
    };

    const result = createVendorValidator.safeParse(vendor);

    expect(result.success).toBeTruthy();
    if (!result.success) return;
    expect(result.data).not.toHaveProperty("account");
    expect(result.data).not.toHaveProperty("channels");
  });

  it("should apply vendorValidatorRefine when syncTimeUnit is HOURS", () => {
    const vendor = {
      vendorId: "123",
      active: true,
      name: "Test Vendor",
      syncTimeUnit: "HOURS",
      syncTimeValue: 12
    };

    const result = createVendorValidator.safeParse(vendor);
    expect(result.success).toBeTruthy();
  });
});
