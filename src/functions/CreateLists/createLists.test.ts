import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { lambdaHandler } from "./handler";
import * as listsEvent from "../../events/lists.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const event: APIGatewayProxyEvent = listsEvent;
    const result: APIGatewayProxyResult = await lambdaHandler(event);

    expect(result.statusCode).toEqual(200);
  });
});
