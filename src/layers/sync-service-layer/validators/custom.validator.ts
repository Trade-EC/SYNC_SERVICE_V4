import { z } from "zod";

export const numberStringValidator = z
  .string()
  .transform(x => Number(x))
  .pipe(z.number());

// TODO: Confirmar con input "aa:bb" y "100"
export const timeString = z.preprocess(value => {
  z.string().parse(value);
  if (typeof value !== "string") throw new Error("");
  const [hours, minutes] = value.split(":");
  return [parseInt(hours), parseInt(minutes)];
}, z.tuple([z.number().min(0).max(23), z.number().min(0).max(59)]));
