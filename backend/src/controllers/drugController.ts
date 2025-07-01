import { Request, Response } from 'express';
import * as drugService from '../services/drugService';
import { activeIngredientMapping } from '../mappings/activeIngredientMapping';
import { adverseReactionMapping } from '../mappings/adverseReactionMapping';
import { productMapping } from '../mappings/productMapping';
import { reportMapping } from '../mappings/reportMapping';
import { shortageMapping } from '../mappings/shortageMapping';

const allowedTables = [
  'shortages',
  'company',
  'adverseReaction',
  'report',
  'activeIngredient',
  'product',
  'Drugs'
];

const numericFields = [
  'id', 'drugId', 'initialPostingDate',
  'drugCount', 'patientAge', 'patientWeight', 'transmissionDate'
];

const allowedJoins: Record<string, string[]> = {
  company: ['Drugs'],
  Drugs: ['AdverseReaction', 'report'],
  report: ['Drugs', 'adverseReactions'],
  product: ['ActiveIngredient', 'Drugs'],
  activeIngredient: ['Product'],
  adverseReaction: ['Drugs', 'report'],
  shortages: ['Drugs']
};

const allowedFields: Record<string, string[]> = {
  shortages: ['id', 'drugId', 'dosageForm', 'description', 'initialPostingDate', 'presentation'],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: ['id', 'occurCountry', 'transmissionDate', 'patientAge', 'patientGender', 'patientWeight'],
  activeIngredient: ['name', 'strength'],
  product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
  Drugs: ['id', 'companyName', 'drugName'],
  AdverseReaction: ['name'],
  adverseReactions: ['name'],
  Drug: ['id', 'companyName', 'drugName'],
  Product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
};

type Ternary = {
  incomingKeyName: string;
  schemaKeyName: string;
  relationFieldName: string;
};

const ternaryMapping: Record<string, Array<Ternary>> = {
  adverseReaction: [
    { incomingKeyName: 'Drugs', schemaKeyName: 'Drugs', relationFieldName: 'Drug' },
    { incomingKeyName: 'report', schemaKeyName: 'reportDrugs', relationFieldName: 'Report' }
  ],
  Drugs: [
    { incomingKeyName: 'AdverseReaction', schemaKeyName: 'RelAdverseReactionXDrug', relationFieldName: 'AdverseReaction' },
    { incomingKeyName: 'report', schemaKeyName: 'RelReportXDrug', relationFieldName: 'Report' }
  ],
  report: [
    { incomingKeyName: 'Drugs', schemaKeyName: 'Drugs', relationFieldName: 'Drug' },
    { incomingKeyName: 'adverseReactions', schemaKeyName: 'adverseReactions', relationFieldName: 'AdverseReaction' }
  ]
};

export const getDrugs = async (req: Request, res: Response) => {
  const { item, join, fields, page, pageSize, ...params } = req.query as any;
  logQuery(item, join, fields, params, page, pageSize);

  if (!item || !allowedTables.includes(item)) {
    return res.status(400).json({ error: `Invalid item parameter. Allowed: ${allowedTables.join(', ')}` });
  }

  const joins = Array.isArray(join) ? join.map(String) : join ? [String(join)] : [];
  const fieldList = fields ? String(fields).split(',').map(f => f.trim()) : [];

  const invalidJoins = joins.filter(j => !allowedJoins[item]?.includes(j));
  // if (invalidJoins.length > 0) {
  //   return res.status(400).json({ error: `Invalid join(s) for ${item}: ${invalidJoins.join(', ')}` });
  // }

  const operatorMap: Record<string, string> = {};
  Object.keys(params).forEach(key => {
    if (key.endsWith('__op')) {
      operatorMap[key.replace(/__op$/, '')] = params[key];
    }
  });

  const ternaryJoins = joins.filter(j => ternaryMapping[item]?.some(t => t.incomingKeyName === j));
  const nonTernaryJoins = joins.filter(j => !ternaryJoins.includes(j));

  const ternaryParams: Record<string, any> = {};
  const nonTernaryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    const baseKey = k.replace(/__op$/, '');
    const isTernary = k.includes('.') && ternaryJoins.some(j => k.startsWith(j + '.'));
    if (isTernary) {
      ternaryParams[k] = v;
    } else {
      nonTernaryParams[k] = v;
    }
  });

  const ternaryFields = fieldList.filter(f => f.includes('.') && ternaryJoins.some(j => f.startsWith(j + '.')));
  const nonTernaryFields = fieldList.filter(f => !ternaryFields.includes(f));

  let where = buildWhere(item, nonTernaryParams, operatorMap);
  let select = buildSelect(item, nonTernaryJoins, nonTernaryFields);

  if (ternaryJoins.length > 0) {
    if (ternaryFields.length > 0) {
      select = buildSelectTernary(item, ternaryJoins, ternaryFields, select);
    }
    if (Object.keys(ternaryParams).length > 0) {
      where = buildWhereTernary(item, ternaryParams, operatorMap, where);
    }
  }

  const skip = ((Number(page) || 1) - 1) * (Number(pageSize) || 20);
  try {
    const data = await drugService.getDrugs(item, where, select, Number(pageSize), skip);
    res.json(mapOutput(item, data));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

function whereParameters(field: string, rawKey: string, value: any, operatorMap: Record<string, string>) {
  const operator = operatorMap[rawKey] || (numericFields.includes(field) ? 'equals' : 'contains');
  const val = numericFields.includes(field) ? Number(value) : value;
  const result: any = { [operator]: val };
  if (['contains', 'startsWith', 'endsWith'].includes(operator)) {
    result.mode = 'insensitive';
  }
  return result;
}

function buildWhere(item: string, params: any, operatorMap: Record<string, string>) {
  const where: any = {};
  for (const rawKey in params) {
    if (!params.hasOwnProperty(rawKey) || rawKey.endsWith('__op')) continue;
    const parts = rawKey.split('.');
    if (parts.length === 2) {
      const [relation, field] = parts;
      where[relation] = where[relation] || {};
      where[relation][field] = whereParameters(field, rawKey, params[rawKey], operatorMap);
    } else {
      where[rawKey] = whereParameters(rawKey, rawKey, params[rawKey], operatorMap);
    }
  }
  return where;
}

function buildWhereTernary(
  item: string,
  params: any,
  operatorMap: Record<string, string>,
  existing: any
) {
  for (const rawKey in params) {
    if (rawKey.endsWith('__op')) continue;
    const [relation, field] = rawKey.split('.');
    const mapping = ternaryMapping[item]?.find(t => t.incomingKeyName === relation);
    if (mapping) {
      existing[mapping.schemaKeyName] = existing[mapping.schemaKeyName] || {};
      existing[mapping.schemaKeyName].every = existing[mapping.schemaKeyName].every || {};
      existing[mapping.schemaKeyName].every[mapping.relationFieldName] =
        existing[mapping.schemaKeyName].every[mapping.relationFieldName] || {};
      existing[mapping.schemaKeyName].every[mapping.relationFieldName][field] =
        whereParameters(field, rawKey, params[rawKey], operatorMap);
    }
  }
  return existing;
}

function buildSelect(item: string, joins: string[], fields: string[]): any {
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

  if (fields && fields.length) {
    for (const f of fields) {
      if (f.includes('.')) {
        addNestedSelect(select, f.split('.'));
      } else {
        select[f] = true;
      }
    }
  }

  for (const joinName of joins) {
    if (!select[joinName]) {
      const val = joinRelationsMap[joinName];
      select[joinName] = val ?? true;
    }
  }

  return select;
}

function buildSelectTernary(item: string, joins: string[], fields: string[], existingSelect: any): any {
  fields.forEach(field => {
    if (field.includes('.')) {
      const [tableName, fieldName] = field.split('.');
      const ternary = ternaryMapping[item]?.find(t => t.incomingKeyName === tableName);
      const schemaKey = ternary?.schemaKeyName;
      const relationKey = ternary?.relationFieldName;

      if (schemaKey && relationKey) {
        if (!existingSelect[schemaKey]) existingSelect[schemaKey] = { select: {} };
        if (!existingSelect[schemaKey].select[relationKey]) {
          existingSelect[schemaKey].select[relationKey] = { select: {} };
        }
        existingSelect[schemaKey].select[relationKey].select[fieldName] = true;
      }
    }
  });
  return existingSelect;
}

function mapOutput(item: string, data: any): any {
  if (item === 'activeIngredient' && Array.isArray(data)) {
    return activeIngredientMapping(data);
  } else if (item === 'adverseReaction' && Array.isArray(data)) {
    return adverseReactionMapping(data);
  } else if (item === 'product' && Array.isArray(data)) {
    return productMapping(data);
  } else if (item === 'report' && Array.isArray(data)) {
    return reportMapping(data);
  } else if (item === 'shortages' && Array.isArray(data)) {
    return shortageMapping(data);
  }
  return data;
}

function logQuery(
  item: any,
  join: any,
  fields: any,
  params: any,
  page: any,
  pageSize: any
) {
  console.log(`Item: ${item}`);
  console.log(`Join: ${join}`);
  console.log(`Fields: ${fields}`);
  console.log(`Params: ${JSON.stringify(params)}`);
  console.log(`Page: ${page}`);
  console.log(`Page Size: ${pageSize}`);
}
