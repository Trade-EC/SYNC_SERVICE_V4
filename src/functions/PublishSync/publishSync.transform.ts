import { logger } from "/opt/nodejs/configs/observability.config";

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
      const { productId } = answer;
      const product = productQuestions.find(
        product => product.attributes.externalId === productId
      );

      if (!product) {
        logger.info("product answer not found", { productId });
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
        ...answer
      };
    });
    return {
      ...question,
      answers: transformedAnswers
    };
  });
};
