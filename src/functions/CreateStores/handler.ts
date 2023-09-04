import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { channelsAndStoresValidator } from "./createStores.validator";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { body } = event;
    const parsedBody = JSON.parse(body ?? "");
    const channelsAndStores = channelsAndStoresValidator.parse(parsedBody);
    const { stores } = channelsAndStores;
    for (const store of stores) {
      const newStore = {
        storeId: store.storeId,
        storeName: store.name,
        address: store.contactInfo.address,
        latitude: store.locationInfo.latitude,
        longitude: store.locationInfo.longitude,
        // description: store.description -- no Existe
        phone: store.contactInfo.phone,
        minOrderAmount: store.deliveryInfo?.minimumOrder,
        // maxOrderAmount: store.deliveryInfo?.maximumOrder -- no existe
        services: store.services, // url?
        active: store.active,
        isDefault: store.default,
        // outOfService: true
        cookTime: store.deliveryInfo?.cookTime,
        // enableTips: false,
        // images No existe,
        minOrder: store.deliveryInfo?.minimumOrder,
        // minOrderSymbol: No existe?
        // orderSymbol: No existe
        sponsored: store.featured,
        // tips: [] De donde sale?
        // timezone: De donde sale?
        location: {
          lat: store.locationInfo.latitude,
          lng: store.locationInfo.longitude
        }
        // additionalInfo:  NO existe?
      };
      console.log(newStore);
    }
    return { statusCode: 200, body: JSON.stringify(stores) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
