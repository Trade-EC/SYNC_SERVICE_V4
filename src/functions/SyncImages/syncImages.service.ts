import { SQSEvent } from "aws-lambda";

import { createOrUpdateImages, saveImage } from "./syncImages.repository";
import { ImageSync } from "./syncImages.types";

import { fetchImage } from "/opt/nodejs/repositories/images.repository";
import { logger } from "/opt/nodejs/configs/observability.config";

export const syncImagesService = async (event: SQSEvent) => {
  const { Records } = event;
  const imagePromises = Records.map(async record => {
    const { body } = record ?? {};
    const imageInfo: ImageSync = JSON.parse(body ?? "");
    const { externalUrl = "", name } = imageInfo;
    logger.appendKeys({ externalUrl, name });

    logger.info("Querying", { externalUrl, name });
    const dbImage = await fetchImage(externalUrl, name);
    if (dbImage) return;
    await createOrUpdateImages({ externalUrl, name, status: "PROCESSING" });
    logger.info("Creating image", { imageInfo });
    const image = await saveImage(externalUrl, name);
    await createOrUpdateImages(image);
  });

  await Promise.all(imagePromises);
};
