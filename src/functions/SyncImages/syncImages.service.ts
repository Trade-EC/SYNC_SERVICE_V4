import { SQSEvent } from "aws-lambda";

import { createOrUpdateImages, saveImage } from "./syncImages.repository";

import { fetchImage } from "/opt/nodejs/repositories/images.repository";

export const syncImagesService = async (event: SQSEvent) => {
  const { Records } = event;
  const [record] = Records;
  const { body } = record ?? {};
  const imageInfo = JSON.parse(body ?? "");
  const { url: externalUrl, imageCategory } = imageInfo;

  const dbImage = await fetchImage(externalUrl, imageCategory);
  if (dbImage) return;
  await createOrUpdateImages({
    externalUrl,
    category: imageCategory,
    status: "PROCESSING"
  });
  const image = await saveImage(externalUrl, imageCategory);
  await createOrUpdateImages(image);
};
