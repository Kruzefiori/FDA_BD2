import { Request, Response } from 'express';
import * as drugService from '../services/drugService';
import { ParsedQs } from 'qs';

const allowedTables = {
  shortages: ['id', 'drugId', 'dosageForm', 'description', 'initialPostingDate', 'presentation'],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: ['id', 'occurCountry', 'transmissionDate', 'patientAge', 'patientGender', 'patientWeight'],
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
  report: ['RelReportXDrug', 'adverseReactions'],
  product: ['ActiveIngredient', 'Drug'],
  activeIngredient: ['Product'],
  adverseReaction: ['RelAdverseReactionXDrug', 'RelAdverseReactionXReport'],
  relAdverseReactionXDrug: ['Drug', 'AdverseReaction'],
  relAdverseReactionXReport: ['Report', 'AdverseReaction'],
  relReportXDrug: ['Report', 'Drug'],
};

export const getDrugs = async (req: Request, res: Response) => {
  const { item, join, ...params } = req.query;

  if (!item || typeof item !== 'string' || !(item in allowedTables)) {
    return res.status(400).json({ error: 'Invalid or missing item parameter. Allowed items are: ' + Object.keys(allowedTables).join(', ') });
  }

  const allowedFields = allowedTables[item as keyof typeof allowedTables];
  const invalidFields = Object.keys(params).filter(
    (key) =>
      !allowedFields.includes(key) &&
      !key.startsWith('min') &&
      !key.startsWith('max')
  );
  // if (invalidFields.length > 0) {
  //   return res.status(400).json({
  //     error: `Invalid parameters for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFields.join(', ')}`,
  //   });
  // }

  const joins = Array.isArray(join)
    ? (join as (string | ParsedQs)[]).map(String)
    : join
    ? [String(join)]
    : [];

  const validJoins = allowedJoins[item] || [];
  const invalidJoins = joins.filter(j => !validJoins.includes(j));
  if (invalidJoins.length > 0) {
    return res.status(400).json({
      error: `Invalid join(s) for ${item}: ${invalidJoins.join(', ')}. Allowed joins are: ${validJoins.join(', ')}`,
    });
  }

  const where = buildWhere(item, params, allowedFields);
  const include = buildInclude(item, joins, params);

  try {
    const data = await drugService.getDrugs(item, where, include);
    res.status(200).json(data);
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

const buildInclude = (item: string, joins: string[], params: any): any => {
  const include: any = {};

  const joinRelationsMap: Record<string, any> = {
    Company: true,
    Drug: true,
    Shortages: true,
    Product: true,
    ActiveIngredient: true,
    adverseReactions: true,
    reportDrugs: true,
    Report: true,
    AdverseReaction: true,
    RelReportXDrug: {
      include: {
        Report: true,
        Drug: true,
      }
    },
    RelAdverseReactionXDrug: {
      include: {
        Drug: true,
        AdverseReaction: true,
      }
    },
    RelAdverseReactionXReport: {
      include: {
        Report: true,
        AdverseReaction: true,
      }
    },
  };

  for (const joinName of joins) {
    const val = joinRelationsMap[joinName];
    include[joinName] = val ?? true;
  }

  return include;
};
