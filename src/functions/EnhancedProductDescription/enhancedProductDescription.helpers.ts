import { ProductDescription } from "./enhancedProductDescription.types";

import { openaiClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { Vendor } from "/opt/nodejs/sync-service-layer/types/vendor.types";

// This message is used by the system to know in which form the product description should be enhanced
const enhanceProductDescriptionPrompt = `
    The user will provide a product description and more information about the seller in order to enhance the product description for an ecommerce platform on both web and mobile apps.
    Please use the following guidelines:
    - Use persuasive and engaging language to make the product more appealing to potential customers.
    - Highlight the unique features and benefits of the product, making sure to emphasize how it stands out from competitors.
    - If relevant, mention the reputation or unique selling points of the seller to build trust with potential customers.
    - Keep the description concise and easy to understand, ensuring it's optimized for both web and mobile viewing.
    - Translate the enhanced description into Spanish, keeping in mind the cultural nuances and preferences of Spanish-speaking customers.
    - Limit the enhanced description to 200 characters to ensure it's quick to read and fits well on mobile screens.
    Just give me the enhanced product description without any other comments by you.
`;

export const buildProductDescriptionForOpenAI = async (
  product: Pick<DbProduct, "name" | "productId" | "description" | "categories">,
  vendor: Vendor
): Promise<ProductDescription> => {
  const { productId, name, description, categories } = product;
  const { name: vendorName, description: vendorDescription } = vendor;
  const uniqueCategories = categories
    .map(category => category.name)
    .filter((name, index, array) => array.indexOf(name) === index);
  const productDescription = `
    Seller ${vendorName} defines itself as ${vendorDescription}.vendor.description
    The product information is:
    - Name: ${name}
    - Description: ${description}
    - Categories: ${uniqueCategories.join(", ")}
    `;
  const chatCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: enhanceProductDescriptionPrompt },
      { role: "user", content: productDescription }
    ],
    max_tokens: 200
  });
  const aiDescription = chatCompletion.choices[0].message.content ?? "";
  return { productId, aiDescription };
};
