import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

export const transformQuestions = (
  questions: any[],
  productQuestions: any[],
  maxLevel: number,
  level = 0
) => {
  if (level === maxLevel) return questions;

  return questions?.map(question => {
    const { answers } = question;
    const transformedAnswers = answers?.map((answer: any) => {
      const { productId, attributes } = answer;
      const { externalId } = attributes;
      const product = productQuestions.find(
        product => product.attributes.externalId === externalId
      );

      if (!product) {
        logger.info("PUBLISH: ANSWER NOT FOUND", { productId });
        return answer;
      }

      product.questions = transformQuestions(
        product.questions,
        productQuestions,
        maxLevel,
        level + 1
      );

      delete product["_id"];
      return {
        ...product,
        ...answer,
        additionalInfo: {
          ...product?.additionalInfo,
          ...answer?.additionalInfo
        },
        productId: product.productId
      };
    });
    return {
      ...question,
      answers: transformedAnswers
    };
  });
};
