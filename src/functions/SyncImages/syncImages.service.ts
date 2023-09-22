import { SQSEvent } from "aws-lambda";

export const syncStoresService = async (event: SQSEvent) => {
  console.log(JSON.stringify({ event }));
};
