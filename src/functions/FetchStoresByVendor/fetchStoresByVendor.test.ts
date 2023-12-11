import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const accountId = faker.string.uuid();
const vendorId = faker.string.uuid();
const channelId = faker.string.uuid();
const storeId = faker.string.uuid();

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
      queryStringParameters: { vendorId, channelId, storeId }
    };
    const result = await lambdaHandler(event, ctx);
    const dbClient = await connectToDatabase();
    const spy = jest.spyOn(dbClient, "collection");
    expect(spy).toBeCalledWith("stores");
    expect(result.statusCode).toEqual(200);
  });
});
