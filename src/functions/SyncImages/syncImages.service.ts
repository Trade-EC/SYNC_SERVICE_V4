import { SQSEvent } from "aws-lambda";

import { createOrUpdateImages, saveImage } from "./syncImages.repository";
import { ImageSync } from "./syncImages.types";

import { fetchImage } from "/opt/nodejs/repositories/images.repository";

export const syncImagesService = async (event: SQSEvent) => {
  const { Records } = event;
  const imagePromises = Records.map(async record => {
    const { body } = record ?? {};
    const imageInfo: ImageSync = JSON.parse(body ?? "");
    const { externalUrl = "", category, name } = imageInfo;

    const dbImage = await fetchImage(externalUrl, category);
    if (dbImage) return;
    await createOrUpdateImages({
      externalUrl,
      name,
      status: "PROCESSING"
    });
    const image = await saveImage(externalUrl, name);
    console.log({ image });
    await createOrUpdateImages(image);
  });

  await Promise.all(imagePromises);
};
