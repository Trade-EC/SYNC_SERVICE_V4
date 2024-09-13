import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

//import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const accountId = faker.string.uuid();
const vendorId = faker.string.uuid();
const type = faker.helpers.arrayElement([
  "STORES",
  "PRODUCTS",
  "SHIPPING_COSTS"
]);
const skip = faker.number.int().toString();

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const countryId = faker.string.uuid();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: accountId, country: countryId },
      queryStringParameters: { vendorId, type, skip }
    };
    const result = await lambdaHandler(event, ctx);
    //const dbClient = await connectToDatabase();
    //const spy = jest.spyOn(dbClient, "collection");
    //expect(spy).toBeCalledWith("versions");
    expect(result.statusCode).toEqual(200);
  });
  // Error case
  it("verifies error response with invalid body", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: accountId },
      queryStringParameters: {}
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(500);
  });
  it("verifies error response with invalid headers", async () => {
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: {},
      queryStringParameters: { vendorId, type, skip }
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(500);
  });
});
