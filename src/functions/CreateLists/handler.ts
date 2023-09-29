import { SQSEvent } from "aws-lambda";

import { syncListsService } from "./createLists.service";
import { CreateListsProps } from "./createLists.types";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (event: SQSEvent) => {
  try {
    const { Records } = event;
    console.log("Records length", Records.length);
    const recordPromises = Records.map(async record => {
      const { body: bodyRecord } = record ?? {};
      const props: CreateListsProps = JSON.parse(bodyRecord ?? "");
      const { body, headers } = props;
      const { accountId } = headers;

      await syncListsService(body, accountId);
      console.log("lists create");
    });
    await Promise.all(recordPromises);
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
