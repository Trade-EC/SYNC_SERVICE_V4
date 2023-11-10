import { SQSEvent } from "aws-lambda";

import { createOrUpdateImages, saveImage } from "./syncImages.repository";
import { ImageSync } from "./syncImages.types";

import { fetchImage } from "/opt/nodejs/repositories/images.repository";
import { logger } from "/opt/nodejs/configs/observability.config";

/**
 *
 * @param event {@link SQSEvent}
 * @description Image service to create or update images in database and s3
 * @returns void
 */
export const syncImagesService = async (event: SQSEvent) => {
  const { Records } = event;
  const imagePromises = Records.map(async record => {
    const { body } = record ?? {};
    const imageInfo: ImageSync = JSON.parse(body ?? "");
    const { externalUrl = "", name } = imageInfo;
    logger.appendKeys({ externalUrl, name });

    logger.info("IMAGE: QUERYING", { externalUrl, name });
    const dbImage = await fetchImage(externalUrl, name);
    if (dbImage) return;
    await createOrUpdateImages({ externalUrl, name, status: "PROCESSING" });
    logger.info("IMAGE: CREATING", { imageInfo });
    const image = await saveImage(externalUrl, name);
    await createOrUpdateImages(image);
    logger.info("IMAGE: FINISHING");
  });

  await Promise.all(imagePromises);
};
