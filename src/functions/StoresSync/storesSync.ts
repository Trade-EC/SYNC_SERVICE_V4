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
      const { storeId, name, description, locationInfo, images } = store;
      const { services, active, isDefault, deliveryInfo, metadata } = store;
      const savedStore = await db.collection("stores").findOne({ storeId });
      console.log(JSON.stringify(savedStore));
      const storeToCreate = {
        status: "DRAFT",
        version: "2023-07-01-1",
        storeId,
        storeExternalId: metadata?.storeExternalId,
        storeName: name,
        name,
        description: description.translations.es_es,
        descriptionV4: description,
        phone: store.contactInfo.phone,
        minOrderAmount: deliveryInfo.minimumOrder,
        maxOrderAmount: deliveryInfo.maximumOrder,
        services,
        active,
        isDefault,
        outOfService: false, // quemado
        cookTime: deliveryInfo.cookTime, // minutes
        enableTips: store.enableTips,
        images: images,
        minOrder: deliveryInfo.minimumOrder,
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
        address: locationInfo.address,
        country: {
          id: locationInfo.countryId,
          name: locationInfo.country
          // active: true De donde sale? - Dani, debe avisar la info
        },
        city: {
          id: locationInfo.cityId,
          name: locationInfo.city
          // active: true De donde sale? - Dani, debe avisar la info
        },
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        location: {
          lat: locationInfo.latitude,
          lon: locationInfo.longitude
        },
        locationV4: {
          address: locationInfo.address,
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
          city: locationInfo.city,
          state: locationInfo.state,
          country: locationInfo.country,
          postalCode: locationInfo.postalCode
        },
        additionalInfo: metadata,
        metadata: metadata,
        account,
        accounts: [account]
      };
      storesToCreate.push(storeToCreate);
    }
    for (const store of storesToCreate) {
      await db.collection("stores").insertOne(store);
    }
    return { statusCode: 200, body: JSON.stringify(stores) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
