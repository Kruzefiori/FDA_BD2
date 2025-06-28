import { Request, Response } from 'express';
import * as drugService from '../services/drugService';
import { ParsedQs } from 'qs';

const allowedTables: Record<string, string[]> = {
  shortages: ['id', 'drugId', 'dosageForm', 'description', 'minInitialPostingDate', 'maxInitialPostingDate', 'presentation'],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: ['id', 'occurCountry', 'minTransmissionDate', 'maxTransmissionDate', 'minPatientAge', 'maxPatientAge', 'patientGender', 'minPatientWeight', 'maxPatientWeight'],
  activeIngredient: ['name', 'strength'],
  product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
  relAdverseReactionXDrug: ['id', 'drugName', 'adverseReaction'],
  relAdverseReactionXReport: ['id', 'reportId', 'adverseReaction'],
  relReportXDrug: ['id', 'reportId', 'drugId'],
  drug: ['id', 'companyName', 'drugName'],
};

const rangeFields: Record<string, string[]> = {
  shortages: ['minInitialPostingDate', 'maxInitialPostingDate'],
  report: ['minTransmissionDate', 'maxTransmissionDate', 'minPatientAge', 'maxPatientAge', 'minPatientWeight', 'maxPatientWeight']
};

const allowedJoins: Record<string, string[]> = {
  shortages: ['Drug'],
  company: ['Drugs'],
  drug: ['Company', 'Shortages', 'RelActiveIngredientXDrug', 'RelAdverseReactionXDrug', 'RelReportXDrug'],
  report: ['drugs', 'adverseReactions'],
  product: ['ActiveIngredient', 'Drug'],
  activeIngredient: ['Product'],
  adverseReaction: ['drugs', 'reportDrugs'],
  relAdverseReactionXDrug: ['Drug', 'AdverseReaction'],
  relAdverseReactionXReport: ['Report', 'AdverseReaction'],
  relReportXDrug: ['Report', 'Drug'],
};

export const getDrugs = async (req: Request, res: Response) => {
  const { item: rawItem, join: rawJoin, ...params } = req.query;

  const item = typeof rawItem === 'string' ? rawItem : null;
  if (!item || !(item in allowedTables)) {
    return res.status(400).json({ error: 'Invalid or missing item parameter. Allowed items are: ' + Object.keys(allowedTables).join(', ') });
  }

  const allowedFields = allowedTables[item];
  const invalidFields = Object.keys(params).filter(
    (key) =>
      !allowedFields.includes(key) &&
      !key.startsWith('min') &&
      !key.startsWith('max')
  );

  const joins: string[] = Array.isArray(rawJoin)
    ? rawJoin.map(j => String(j))
    : rawJoin
      ? [String(rawJoin)]
      : [];

  const validJoins = allowedJoins[item] || [];
  const invalidJoins = joins.filter(j => !validJoins.includes(j));
  if (invalidJoins.length > 0) {
    return res.status(400).json({
      error: `Invalid join(s) for ${item}: ${invalidJoins.join(', ')}. Allowed joins are: ${validJoins.join(', ')}`,
    });
  }

  const where = buildWhere(item, params, allowedFields);
  const include = buildInclude(joins);

  try {
    const drugs = await drugService.getDrugs(item, where, include);
    res.status(200).json(drugs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const buildWhere = (item: string, params: any, allowedFields: string[]) => {
  const where: any = {};
  const rangeAllowed = rangeFields[item] || [];

  for (const field of allowedFields) {
    if (rangeAllowed.includes(field) && params[field] !== undefined) {
      if (field.startsWith('min')) {
        let fieldName = field.replace('min', '');
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        where[fieldName] = where[fieldName] || {};
        where[fieldName].gte = isNaN(params[field]) ? params[field] : Number(params[field]);
      }
      if (field.startsWith('max')) {
        let fieldName = field.replace('max', '');
        fieldName = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
        where[fieldName] = where[fieldName] || {};
        where[fieldName].lte = isNaN(params[field]) ? params[field] : Number(params[field]);
      }
    } else if (params[field]) {
      where[field] = {
        contains: params[field],
        mode: 'insensitive'
      };
    }
  }

  return where;
};

const buildInclude = (joins: string[]): any => {
  const include: Record<string, boolean> = {};
  for (const j of joins) {
    include[j] = true;
  }
  return include;
};
