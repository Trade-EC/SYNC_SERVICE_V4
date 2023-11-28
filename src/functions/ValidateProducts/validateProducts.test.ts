import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import * as productsEvent from "../../events/products.gateway.json";

const sqsMockClient = mockClient(sqsClient);

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const sqsSpy = jest.spyOn(sqsClient, "sendMessage");
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = productsEvent;
    const result = await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
    expect(result.statusCode).toEqual(200);
  });
});
