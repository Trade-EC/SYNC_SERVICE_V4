import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { storesRequestValidation } from "./storesSync.helpers";
import { connectToDatabase } from "../../config/mongodb.config";
import { handleError } from "../../utils/error.utils";
import { transformScheduleV4ToSchedule } from "../../utils/schedules.utils";
import { channelsAndStoresHeadersValidation } from "../../validators/headers.validator";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const db = await connectToDatabase();
    const { body, headers } = event;
    const parsedHeaders = channelsAndStoresHeadersValidation.parse(headers);
    const parsedBody = JSON.parse(body ?? "");
    const stores = storesRequestValidation.parse(parsedBody);
    const { Accountid: accountId } = parsedHeaders;
    const account = await db.collection("account").findOne({ accountId });
    const storesToCreate = [];
    for (const store of stores) {
      const storeToCreate = {
        status: "DRAFT",
        version: "2023-07-01-1",
        storeId: store.storeId,
        storeExternalId: store.metadata?.storeExternalId,
        storeName: store.name,
        name: store.name,
        description: store.description.translations.es_es,
        descriptionV4: store.description,
        phone: store.contactInfo.phone,
        minOrderAmount: store.deliveryInfo.minimumOrder,
        maxOrderAmount: store.deliveryInfo.maximumOrder,
        services: store.services,
        active: store.active,
        isDefault: store.isDefault,
        outOfService: false, // quemado
        cookTime: store.deliveryInfo.cookTime, // minutes
        enableTips: store.enableTips,
        images: store.images,
        minOrder: store.deliveryInfo.minimumOrder,
        // minOrderSymbol
        // orderSymbol
        polygons: store.polygons,
        sponsored: false, // quemado
        tips: [], // quemado
        timezone: store.timezone,
        // vendor De donde sale? - De alguna forma lo obtendré
        schedules: transformScheduleV4ToSchedule(
          store.schedulesByChannel,
          store.storeId
        ),
        schedulesByChannelV4: store.schedulesByChannel,
        catalogues: [],
        address: store.locationInfo.address,
        country: {
          id: store.locationInfo.countryId,
          name: store.locationInfo.country
          // active: true De donde sale? - Dani, debe avisar la info
        },
        city: {
          id: store.locationInfo.cityId,
          name: store.locationInfo.city
          // active: true De donde sale? - Dani, debe avisar la info
        },
        latitude: store.locationInfo.latitude,
        longitude: store.locationInfo.longitude,
        location: {
          lat: store.locationInfo.latitude,
          lon: store.locationInfo.longitude
        },
        locationV4: {
          address: store.locationInfo.address,
          latitude: store.locationInfo.latitude,
          longitude: store.locationInfo.longitude,
          city: store.locationInfo.city,
          state: store.locationInfo.state,
          country: store.locationInfo.country,
          postalCode: store.locationInfo.postalCode
        },
        additionalInfo: store.metadata,
        metadata: store.metadata,
        account,
        accounts: [account]
      };
      storesToCreate.push(storeToCreate);
    }
    return { statusCode: 200, body: JSON.stringify(stores) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
