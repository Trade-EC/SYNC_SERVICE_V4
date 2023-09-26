import { syncStoresService } from "./createStores.service";
import { CreateStoresProps } from "./createStores.types";

import { handleError } from "/opt/nodejs/utils/error.utils";

export async function lambdaHandler(props: CreateStoresProps) {
  const { body, headers } = props;
  const { accountId } = headers;
  try {
    const response = await syncStoresService(body, accountId);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
}
