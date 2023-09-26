import { SQSEvent } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

import { syncImagesService } from "./syncImages.service";

export const lambdaHandler = async (event: SQSEvent) => {
  try {
    await syncImagesService(event);
  } catch (e) {
    console.log("Error");
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
