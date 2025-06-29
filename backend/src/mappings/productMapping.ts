export const productMapping = (data: Array<any>): any => {
  let output: Array<any> = [];
  data.forEach(product => {
    if (product.Drug) {
      output.push({
        ...baseFields(product),
        "Drug.id": product.Drug.id ?? undefined,
        "Drug.companyName": product.Drug.companyName ?? undefined,
        "Drug.drugName": product.Drug.drugName ?? undefined
      });
    } else {
      output.push({ ...baseFields(product) });
    }
  });
  return output;
}

const baseFields = (product: any): any => ({
  id: product.id ?? undefined,
  activeIngredientName: product.activeIngredientName ?? undefined,
  activeIngredientStrength: product.activeIngredientStrength ?? undefined,
  dosageForm: product.dosageForm ?? undefined,
  route: product.route ?? undefined,
  drugId: product.drugId ?? undefined
});