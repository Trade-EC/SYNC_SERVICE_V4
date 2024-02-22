export const transformProducts = (products: any[]) => {
  return products.map(product => {
    product.tags = product.tags?.replace("[", "").replace("]", "").split(",");
    product.upselling = product.upselling
      ?.replace("[", "")
      .replace("]", "")
      .split(",");
    if (product.taxInfo && product.taxInfo.length > 0) {
      product.taxInfo = product.taxInfo[0];
    }
    if (product.description === null) {
      delete product.description;
    }
    if (!product.productModifiers) {
      product.productModifiers = [];
    }
    return product;
  });
};

export const transformHorneroLists = (listRequest: any) => {
  const { products } = listRequest;

  listRequest.products = transformProducts(products);

  return listRequest;
};
