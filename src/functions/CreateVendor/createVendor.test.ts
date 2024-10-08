import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";
import { buildVendor } from "../../builders/vendors/vendors.builders";
import { createVendorValidator } from "./createVendor.validator";

//import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { dynamoDBClient } from "/opt/nodejs/sync-service-layer/configs/config";

const dynamoDbMockClient = mockClient(dynamoDBClient);

afterAll(() => {
  dynamoDbMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  //let dbClient: any;
  beforeAll(async () => {
    //dbClient = await connectToDatabase();
  });
  it("createVendorService verifies successful response", async () => {
    const countryId = faker.string.uuid();
    const vendor = buildVendor(countryId);
    const { account } = vendor;
    const { accountId } = account;
    const ctx = context();
    ctx.done();
    //const spy = jest.spyOn(dbClient, "collection");
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(vendor),
      headers: { account: accountId, country: countryId }
    };

    const response = await lambdaHandler(event, ctx);

    //expect(spy).toBeCalledWith("vendors");
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
  it("should omit account and channels fields when syncTimeUnit is HOURS", () => {
    const vendor = {
      vendorId: "123",
      account: { accountId: "456" },
      active: true,
      name: "Test Vendor",
      syncTimeUnit: "HOURS",
      syncTimeValue: 12,
      channels: ["channel1", "channel2"],
      countryId: "1",
      externalId: "1",
      isSyncActive: true
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
      syncTimeValue: 12,
      countryId: "1",
      externalId: "1",
      isSyncActive: true
    };

    const result = createVendorValidator.safeParse(vendor);
    expect(result.success).toBeTruthy();
  });
});
