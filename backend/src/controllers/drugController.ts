import { Request, Response } from 'express';
import * as drugService from '../services/drugService';

const allowedTables = {
  shortages: [
    'id',
    'drugId',
    'dosageForm',
    'description',
    'initialPostingDate',
    'presentation',
  ],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: [
    'id',
    'occurCountry',
    'transmissionDate',
    'patientAge',
    'patientGender',
    'patientWeight',
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

export const getDrugs = async (req: Request, res: Response) => {
  const { item, ...params } = req.query;

  console.log('Received query parameters:', params);

  // Verifica se o nome da tabela (item) é válido
  if (!item || typeof item !== 'string' || !(item in allowedTables)) {
    return res.status(400).json({
      error: 'Invalid or missing item parameter. Allowed items are: ' + Object.keys(allowedTables).join(', '),
    });
  }

  // Verifica se os parâmetros fornecidos estão entre os permitidos para a tabela
  const allowedFields = allowedTables[item as keyof typeof allowedTables];
  const invalidFields = Object.keys(params).filter(
    (key) => !allowedFields.includes(key)
  );
  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Invalid parameters for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`,
    });
  }

  // Processa os filtros para a consulta de acordo com os parâmetros fornecidos
  const where: any = {}
  for (const field of allowedTables[item as keyof typeof allowedTables]) {
    console.log(`Filtering by ${field}:`, params[field]);
    if (params[field]) {
      where[field] = { 
        contains: params[field] as string,
        mode: 'insensitive'
      };
    }
  }

  try {
    const drugs = await drugService.getDrugs(item, where);
    res.status(200).json(drugs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};