import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { lambdaHandler } from "./handler";
import * as storeEvent from "../../events/stores.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const event: APIGatewayProxyEvent = storeEvent;
    const result: APIGatewayProxyResult = await lambdaHandler(event);

    expect(result.statusCode).toEqual(200);
  });
});
