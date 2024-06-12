import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";
import { buildVendor } from "../../builders/vendors/vendors.builders";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  let dbClient: any;
  beforeAll(async () => {
    dbClient = await connectToDatabase();
  });
  it("updateVendor verifies successful response", async () => {
    const ctx = context();
    const countryId = faker.string.uuid();
    const vendor = buildVendor(countryId);
    const { account, vendorId } = vendor;
    const { accountId } = account;
    ctx.done();
    const spy = jest.spyOn(dbClient, "collection");
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      pathParameters: { vendorId },
      body: JSON.stringify(vendor),
      headers: { account: accountId, country: countryId }
    };

    const response = await lambdaHandler(event, ctx);

    expect(spy).toBeCalledWith("vendors");
    expect(response.statusCode).toEqual(200);
  });
  it("updateVendor verifies params error response", async () => {
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
