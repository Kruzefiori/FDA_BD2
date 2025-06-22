import { Request, Response } from 'express';
import * as drugService from '../services/drugService';

const allowedTables = {
  shortages: [
    'id',
    'drugId',
    'dosageForm',
    'description',
    'minInitialPostingDate',
    'maxInitialPostingDate',
    'presentation',
  ],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: [
    'id',
    'occurCountry',
    'minTransmissionDate',
    'maxTransmissionDate',
    'minPatientAge',
    'maxPatientAge',
    'patientGender',
    'minPatientWeight',
    'maxPatientWeight',
  ],
  activeIngredient: ['name', 'strength'],
  product: [
    'id',
    'activeIngredientName',
    'activeIngredientStrength',
    'dosageForm',
    'route',
    'drugId',
  ],
  relAdverseReactionXDrug: ['id', 'drugName', 'adverseReaction'],
  relAdverseReactionXReport: ['id', 'reportId', 'adverseReaction'],
  relReportXDrug: ['id', 'reportId', 'drugId'],
  drug: ['id', 'companyName', 'drugName'],
};

const rangeFields: Record<string, string[]> = {
  shortages: [
    'minInitialPostingDate',
    'maxInitialPostingDate',
  ],
  report: [
    'minTransmissionDate',
    'maxTransmissionDate',
    'minPatientAge',
    'maxPatientAge',
    'minPatientWeight',
    'maxPatientWeight'
  ]
}

export const getDrugs = async (req: Request, res: Response) => {
  const { item, ...params } = req.query;

  // Verifica se o nome da tabela (item) é válido
  if (!item || typeof item !== 'string' || !(item in allowedTables)) {
    return res.status(400).json({
      error: 'Invalid or missing item parameter. Allowed items are: ' + Object.keys(allowedTables).join(', '),
    });
  }

  // Verifica se os parâmetros fornecidos estão entre os permitidos para a tabela
  const allowedFields = allowedTables[item as keyof typeof allowedTables];
  const invalidFields = Object.keys(params).filter(
    (key) => 
      !allowedFields.includes(key) &&
      !key.startsWith('min') &&
      !key.startsWith('max')
  );
  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Invalid parameters for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`,
    });
  }

  // Processa os filtros para a consulta de acordo com os parâmetros fornecidos
  const where = buildWhere(item, params, allowedFields);

  try {
    const drugs = await drugService.getDrugs(item, where);
    res.status(200).json(drugs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const buildWhere = (item: string, params: any, allowedFields: string[]) => {
  const where: any = {};
  const rangeAllowed = rangeFields[item] || [];

  for (const field of allowedFields) {

    console.log(`Processing field: ${field} with value: ${params[field]}`);

    if (rangeAllowed.includes(field) && params[field] !== undefined) {

      /*
      const minKey = `min${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const maxKey = `max${field.charAt(0).toUpperCase() + field.slice(1)}`; */

      if (field.startsWith('min')) {
        // remove min from the string
        let fieldName = field.replace('min', '');
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        where[fieldName] = where[fieldName] || {};
        where[fieldName].gte = isNaN(params[field]) ? params[field] : Number(params[field]);
      }
      if (field.startsWith('max')) {
        // remove max from the string and make the first letter lowercase
        let fieldName = field.replace('max', '');
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        where[fieldName] = where[fieldName] || {};
        where[fieldName].lte = isNaN(params[field]) ? params[field] : Number(params[field]);
      }
    } else {
      if (params[field]) {
        where[field] = { 
          contains: params[field] as string,
          mode: 'insensitive'
        };
      }
    }
  }

  return where;
}