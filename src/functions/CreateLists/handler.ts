import { SQSEvent } from "aws-lambda";

import { syncListsService } from "./createLists.service";
import { CreateListsProps } from "./createLists.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (event: SQSEvent) => {
  try {
    const { Records } = event;
    const recordPromises = Records.map(async record => {
      const { body: bodyRecord } = record ?? {};
      const props: CreateListsProps = JSON.parse(bodyRecord ?? "");
      const { body, headers } = props;
      const { accountId } = headers;

      await syncListsService(body, accountId);
      console.log("lists create");
    });
    await Promise.all(recordPromises);
  } catch (error) {
    logger.error("creating stores error", { error });
    return error;
  }
};
