import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

//import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const accountId = faker.string.uuid();
const vendorId = faker.string.uuid();
const version = faker.date.past().getTime().toString();

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    const countryId = faker.string.uuid();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      headers: { account: accountId, country: countryId },
      queryStringParameters: { vendorId, version }
    };
    const result = await lambdaHandler(event, ctx);
    //const dbClient = await connectToDatabase();
    //const spy = jest.spyOn(dbClient, "collection");
    //expect(spy).toBeCalledWith("historyStores");
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
});
