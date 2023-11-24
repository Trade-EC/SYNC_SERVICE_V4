import middy from "@middy/core";

export const middyWrapper = (handler: any) => {
  return middy().handler(handler);
};
