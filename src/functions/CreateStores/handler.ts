import { SQSEvent } from "aws-lambda";

import { syncStoresService } from "./createStores.service";
import { CreateStoresProps } from "./createStores.types";

import { handleError } from "/opt/nodejs/utils/error.utils";

export async function lambdaHandler(event: SQSEvent) {
  try {
    const { Records } = event;
    const [record] = Records;
    const { body: bodyRecord } = record ?? {};
    const props: CreateStoresProps = JSON.parse(bodyRecord ?? "");
    const { body, headers } = props;
    const { accountId } = headers;
    const response = await syncStoresService(body, accountId);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
}
