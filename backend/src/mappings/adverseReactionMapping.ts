
export const adverseReactionMapping = (data: Array<any>): any => {
  let output: Array<any> = [];
  data.forEach((adverseReaction: any) => {
    if (adverseReaction.reportDrugs) {
      const reportDrugs = adverseReaction.reportDrugs as unknown as Array<any>;
      reportDrugs.forEach((reportDrug: any) => {
        output.push({
        ...baseFields(adverseReaction),
        'drug.drugId': reportDrug.Drug?.id ?? undefined,
        'drug.drugName': reportDrug.Drug?.drugName ?? undefined,
        'drug.companyName': reportDrug.Drug?.companyName ?? undefined,
        'report.id': reportDrug.Report?.id ?? undefined,
        'report.occurCountry': reportDrug.Report?.occurCountry ?? undefined,
        'report.transmissionDate': reportDrug.Report?.transmissionDate ?? undefined,
        'report.patientAge': reportDrug.Report?.patientAge ?? undefined,
        'report.patientGender': reportDrug.Report?.patientGender ?? undefined,
        'report.patientWeight': reportDrug.Report?.patientWeight ?? undefined
      });
    });
    } else {
      output.push({
        ...baseFields(adverseReaction),
      });
    }
  });
  return output;
}

const baseFields = (adverseReaction: any): any => ({
  id: adverseReaction.id ?? undefined,
  name: adverseReaction.name ?? undefined
});