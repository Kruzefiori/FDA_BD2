export const activeIngredientMapping = (data: Array<any>) => {
  let output: Array<any> = [];
  data.forEach((activeIngredient: any) => {
    if (activeIngredient.Product) {
      const products = activeIngredient.Product as Array<any> || [];
      products.forEach((product: any) => {
        output.push({
          ...baseFields(activeIngredient),
          "Product.id": product.id ?? undefined,
          "Product.activeIngredientName": product.activeIngredientName ?? undefined,
          "Product.activeIngredientStrength": product.activeIngredientStrength ?? undefined,
          "Product.dosageForm": product.dosageForm ?? undefined,
          "Product.route": product.route ?? undefined,
          "Product.drugId": product.drugId ?? undefined
        });
      });
    } else {
      output.push({
        ...baseFields(activeIngredient)
      });
    }
  });
  return output;    
}

const baseFields = (activeIngredient: any): any => ({
  id: activeIngredient.id ?? undefined,
  name: activeIngredient.name ?? undefined,
  strength: activeIngredient.strength ?? undefined
});