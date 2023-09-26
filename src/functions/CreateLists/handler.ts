import { syncListsService } from "./createLists.service";
import { CreateListsProps } from "./createLists.types";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (props: CreateListsProps) => {
  try {
    const { body, headers } = props;
    const { accountId } = headers;

    await syncListsService(body, accountId);
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
