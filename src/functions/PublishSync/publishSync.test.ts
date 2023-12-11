import { faker } from "@faker-js/faker";
import { SQSEvent } from "aws-lambda";
import context from "aws-lambda-mock-context";

import { lambdaHandler } from "./handler";
import { PublishSyncServiceProps } from "./publishSync.types";
import * as sqsEvent from "../../events/sqs.json";

describe("Unit test for app handler", function () {
  it("verifies successful response", async () => {
    const ctx = context();
    ctx.done();
    const body: PublishSyncServiceProps = {
      accountId: faker.string.uuid(),
      vendorId: faker.string.uuid()
    };
    const event: SQSEvent = sqsEvent;
    event.Records[0].body = JSON.stringify(body);
    const result = await lambdaHandler(event, ctx);

    expect(result.batchItemFailures).toEqual([]);
  });
});
