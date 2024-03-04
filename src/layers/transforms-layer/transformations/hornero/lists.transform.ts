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
    if (Array.isArray(product.taxInfo) && product.taxInfo.length === 0) {
      product.taxInfo = {};
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

export const transformModifierGroups = (modifierGroups: any[]) => {
  return modifierGroups.map(modifierGroup => {
    const { type } = modifierGroup;
    return {
      ...modifierGroup,
      type: type ? type : "CUSTOM"
    };
  });
};

export const transformHorneroLists = (listRequest: any) => {
  const { products, modifierGroups } = listRequest;

  listRequest.products = transformProducts(products);
  listRequest.modifierGroups = transformModifierGroups(modifierGroups);

  return listRequest;
};
