import { Request, Response } from 'express';
import * as drugService from '../services/drugService';
import { ParsedQs } from 'qs';

const allowedTables = [
  'shortages', 
  'company', 
  'adverseReaction', 
  'report', 
  'activeIngredient', 
  'product', 
  'drug'
];

const rangeFields: Record<string, string[]> = {
  shortages: ['minInitialPostingDate', 'maxInitialPostingDate'],
  report: ['minTransmissionDate', 'maxTransmissionDate', 'minPatientAge', 'maxPatientAge', 'minPatientWeight', 'maxPatientWeight']
};

const allowedJoins: Record<string, string[]> = {
  company: [],
  drug: ['Company', 'Shortages'],
  report: ['drugs', 'adverseReactions'],
  product: ['ActiveIngredient', 'Drug'],
  activeIngredient: ['Product'],
  adverseReaction: ['drugs', 'reportDrugs'],
  shortages: ['Drug'],
  // relAdverseReactionXDrug: ['Drug', 'AdverseReaction'],
  // relAdverseReactionXReport: ['Report', 'AdverseReaction'],
  // relReportXDrug: ['Report', 'Drug'],
};

const allowedFields: Record<string, string[]> = {
  shortages: ['id', 'drugId', 'dosageForm', 'description', 'initialPostingDate', 'presentation'],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: ['id', 'occurCountry', 'transmissionDate', 'patientAge', 'patientGender', 'patientWeight'],
  activeIngredient: ['name', 'strength'],
  product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
  // relAdverseReactionXDrug: ['id', 'drugName', 'adverseReaction'],
  // relAdverseReactionXReport: ['id', 'reportId', 'adverseReaction'],
  // relReportXDrug: ['id', 'reportId', 'drugId'],
  drug: ['id', 'companyName', 'drugName'],
};


export const getDrugs = async (req: Request, res: Response) => {
  const { item, join, fields, page, pageSize, ...params } = req.query;

  if (!item || typeof item !== 'string' || !allowedTables.includes(item)) {
    return res.status(400).json({ error: 'Invalid item parameter. Allowed items are: ' + allowedTables.join(', ') });
  }

  [page, pageSize].forEach(param => {
    if (param && typeof param !== 'string' && typeof param !== 'number') {
      return res.status(400).json({ error: `Invalid parameter ${param}. It should be a string or number.` });
    }
  });

  /*
  const allowedItems = allowedTables[item as keyof typeof allowedTables];
  const invalidItems = Object.keys(params).filter(
    (key) =>
      !allowedItems.includes(key) &&
      !key.startsWith('min') &&
      !key.startsWith('max')
  );
  // if (invalidFields.length > 0) {
  //   return res.status(400).json({
  //     error: `Invalid parameters for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedItems.join(', ')}`,
  //   });
  // } */

  const allowedFieldsInTable = allowedFields[item] || [];
  if (Array.isArray(join)) {
    join.forEach(j => {
      const joinName = j.toString().toLowerCase();
      const joinFields = allowedFields[joinName] || [];
      joinFields.forEach(f => {
        allowedFieldsInTable.push(`${j}.${f}`);
      });
    })
  }

  const invalidFields = allowedFieldsInTable
    .filter(f => !allowedFieldsInTable.includes(f));
  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Invalid fields for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFieldsInTable.join(', ')}`,
    });
  }
 
  const fieldList = String(fields).split(',').map(f => f.trim());
 
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

  const where = buildWhere(item, params, allowedFields[item]);
  const select = buildSelect(item, joins, fieldList);
  const skip = (Number(page) - 1) * Number(pageSize);
  try {
    const data = await drugService.getDrugs(item, where, select, Number(pageSize), skip);
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const buildWhere = (item: string, params: any, allowedItems: string[]) => {
  const where: any = {};
  const rangeAllowed = rangeFields[item] || [];

  console.log(params);

  for (const field of allowedItems) {
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

const buildSelect = (item: string, joins: string[], fields: string[]): any => {
  const select: any = {};

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
      select: {
        Report: true,
        Drug: true,
      }
    },
    RelAdverseReactionXDrug: {
      select: {
        Drug: true,
        AdverseReaction: true,
      }
    },
    RelAdverseReactionXReport: {
      select: {
        Report: true,
        AdverseReaction: true,
      }
    },
  };

  // Helper to build nested select
  function addNestedSelect(obj: any, path: string[]) {
    const [head, ...rest] = path;
    if (!head) return;
    if (rest.length === 0) {
      obj[head] = true;
    } else {
      if (!obj[head]) obj[head] = { select: {} };
      if (!obj[head].select) obj[head].select = {};
      addNestedSelect(obj[head].select, rest);
    }
  }

  if (fields) {
    const fieldList = String(fields).split(',').map(f => f.trim());
    for (const f of fieldList) {
      if (f.includes('.')) {
        addNestedSelect(select, f.split('.'));
      } else {
        select[f] = true;
      }
    }
  }

  for (const joinName of joins) {
    // Only add join if not already specified by nested select
    if (!select[joinName]) {
      const val = joinRelationsMap[joinName];
      select[joinName] = val ?? true;
    }
  }

  return select;
};
