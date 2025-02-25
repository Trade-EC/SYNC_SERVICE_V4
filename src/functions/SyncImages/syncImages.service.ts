import { SQSEvent, SQSBatchResponse } from "aws-lambda";

import { createOrUpdateImages, saveImage } from "./syncImages.repository";
import { ImageSync } from "./syncImages.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

/**
 *
 * @param event {@link SQSEvent}
 * @description Image service to create or update images in database and s3
 * @returns void
 */
export const syncImagesService = async (event: SQSEvent) => {
  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const imagePromises = Records.map(async record => {
    try {
      const { body } = record ?? {};
      const imageInfo: ImageSync = JSON.parse(body ?? "");
      logger.info("IMAGE: CREATING", { imageInfo });
      const image = await saveImage(imageInfo);
      await createOrUpdateImages(image);
      logger.info("IMAGE: FINISHING");
    } catch (error) {
      logger.error("error", { error });
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      return error;
    }
  });

  await Promise.all(imagePromises);

  return response;
};
