import { faker } from "@faker-js/faker";
import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import * as gatewayEvent from "../../events/gateway.json";

//import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";

const vendorId = faker.string.uuid();
const version = faker.date.past().getTime();

afterAll(() => {
  jest.resetAllMocks();
});

describe("Unit test for app handler", () => {
  it("verifies successful response with stores", async () => {
    //const dbClient = await connectToDatabase();
    //const spy = jest.spyOn(dbClient, "collection");
    const ctx = context();
    ctx.done();
    const body = { vendorId, type: "STORES", version };
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(body)
    };
    const result = await lambdaHandler(event, ctx);
    //expect(spy).toBeCalledWith("historyStores");
    //expect(spy).toBeCalledWith("historyShippingCost");

    expect(result.statusCode).toEqual(200);
  });
  it("verifies error response with products for version not found", async () => {
    //const dbClient = await connectToDatabase();
    //const spy = jest.spyOn(dbClient, "collection");
    const ctx = context();
    ctx.done();
    const body = { vendorId, type: "PRODUCTS", version };
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(body)
    };
    const result = await lambdaHandler(event, ctx);

    //expect(spy).toBeCalledWith("historyProducts");
    expect(result.statusCode).toEqual(500);
  });
  // Error case
  it("verifies error response with invalid type", async () => {
    const ctx = context();
    ctx.done();
    const body = { vendorId, type: "INVALID", version };
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(body)
    };
    const result = await lambdaHandler(event, ctx);
    expect(result.statusCode).toEqual(500);
  });
});
