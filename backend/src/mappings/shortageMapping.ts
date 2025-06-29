export const shortageMapping = (data: Array<any>): any => {
  let output: Array<any> = [];
  data.forEach(shortage => {
    if (shortage.Drug) {
      output.push({
        ...baseFields(shortage),
        "Drug.id": shortage.Drug.id ?? undefined,
        "Drug.companyName": shortage.Drug.companyName ?? undefined,
        "Drug.drugName": shortage.Drug.drugName ?? undefined,
      });
    } else {
      output.push({ ...baseFields(shortage) })
    }
  });
  return output;
}

const baseFields = (shortage: any): any => ({
  id: shortage.id ?? undefined,
  drugId: shortage.drugId ?? undefined,
  dosageForm: shortage.dosageForm ?? undefined,
  description: shortage.description ?? undefined,
  initialPostingDate: formatToDDMMYYYY(shortage.initialPostingDate) ?? undefined,
  presentation: shortage.presentation ?? undefined,
});

// A function to convert a timestamp like 2012-02-22T00:00:00.000Z to DD/MM/YYYY
const formatToDDMMYYYY = (timestamp: string): string => {
  const date = new Date(timestamp);

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}