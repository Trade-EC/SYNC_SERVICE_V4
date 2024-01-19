import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

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
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: accountId },
      queryStringParameters: { vendorId, type, skip }
    };
    const result = await lambdaHandler(event, ctx);
    const dbClient = await connectToDatabase();
    const spy = jest.spyOn(dbClient, "collection");
    expect(spy).toBeCalledWith("versions");
    expect(result.statusCode).toEqual(200);
  });
});
