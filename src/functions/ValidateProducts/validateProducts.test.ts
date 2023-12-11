import { APIGatewayProxyEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";
import { mockClient } from "aws-sdk-client-mock";

import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

import { lambdaHandler } from "./handler";
import { buildProductRequest } from "../../builders/lists/lists.builders";
import * as gatewayEvent from "../../events/gateway.json";

const sqsMockClient = mockClient(sqsClient);
const mockProducts = buildProductRequest();

afterAll(() => {
  sqsMockClient.reset();
  jest.resetAllMocks();
});

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const sqsSpy = jest.spyOn(sqsClient, "sendMessage");
    const ctx = context();
    ctx.done();
    const event: APIGatewayProxyEvent = {
      ...gatewayEvent,
      body: JSON.stringify(mockProducts)
    };
    const result = await lambdaHandler(event, ctx);

    expect(sqsSpy).toBeCalled();
    expect(result.statusCode).toEqual(200);
  });
});
