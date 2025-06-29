
export const reportMapping = (data: Array<any>): any => {
  let output: Array<any> = [];
  data.forEach((report: any) => {
    const adverseReactions = report.adverseReactions as Array<any> || undefined;
    const drugs = report.drugs as Array<any> || undefined;
    const adverseReactionsFullString: string | undefined =  getAdverseReactionsString(adverseReactions);

    if (drugs) {
      drugs.forEach((drug: any) => {
        output.push({
          ...baseFields(report),
          "drugs.drugId": drug.Drug?.id ?? undefined,
          "drugs.drugName": drug.Drug?.drugName ?? undefined,
          "drugs.companyName": drug.Drug?.companyName ?? undefined,
          "adverseReactions.name": adverseReactionsFullString ?? undefined,
        });
      });
    } else {
      output.push({
        ...baseFields(report),
        "adverseReactions.name": adverseReactionsFullString ?? undefined,
      });
    }
  });
  return output;
}

const getAdverseReactionsString = (adverseReactions?: Array<any>): string | undefined => {
  return adverseReactions?.map((ar: any) => ar.AdverseReaction?.name ?? '').join(', ') ?? undefined;
}

const baseFields = (report: any): any => ({
  id: report.id ?? undefined,
  occurCountry: report.occurCountry ?? undefined,
  transmissionDate: report.transmissionDate ?? undefined,
  patientAge: report.patientAge ?? undefined,
  patientGender: report.patientGender ?? undefined,
  patientWeight: report.patientWeight ?? undefined,
});