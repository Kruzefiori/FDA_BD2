import { Request, Response } from 'express';
import * as drugService from '../services/drugService';
import { ParsedQs } from 'qs';
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
  'drug'
];

const numericFields = [
  'id', 'drugId', 'initialPostingDate',
  'drugCount', 'patientAge', 'patientWeight', 'transmissionDate'
];

const rangeFields: Record<string, string[]> = {
  shortages: ['minInitialPostingDate', 'maxInitialPostingDate'],
  report: ['minTransmissionDate', 'maxTransmissionDate', 'minPatientAge', 'maxPatientAge', 'minPatientWeight', 'maxPatientWeight']
};

const allowedJoins: Record<string, string[]> = {
  company: ['drug'],
  drug: ['AdverseReaction', 'report'],
  report: ['drugs', 'adverseReactions'],
  product: ['ActiveIngredient', 'Drug'],
  activeIngredient: ['Product'],
  adverseReaction: ['drugs', 'report'],
  shortages: ['Drug']
};

const allowedFields: Record<string, string[]> = {
  shortages: ['id', 'drugId', 'dosageForm', 'description', 'initialPostingDate', 'presentation'],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: ['id', 'occurCountry', 'transmissionDate', 'patientAge', 'patientGender', 'patientWeight'],
  activeIngredient: ['name', 'strength'],
  product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
  drug: ['id', 'companyName', 'drugName'],
  AdverseReaction: ['name'],
  adverseReactions: ['name'],
  drugs: ['id', 'companyName', 'drugName'],
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
    { incomingKeyName: 'drugs', schemaKeyName: 'drugs', relationFieldName: 'Drug' },
    { incomingKeyName: 'report', schemaKeyName: 'reportDrugs', relationFieldName: 'Report' }
  ],
  drug: [
    { incomingKeyName: 'AdverseReaction', schemaKeyName: 'RelAdverseReactionXDrug', relationFieldName: 'AdverseReaction' },
    { incomingKeyName: 'report', schemaKeyName: 'RelReportXDrug', relationFieldName: 'Report' }
  ],
  report: [
    { incomingKeyName: 'drugs', schemaKeyName: 'drugs', relationFieldName: 'Drug' },
    { incomingKeyName: 'adverseReactions', schemaKeyName: 'adverseReactions', relationFieldName: 'AdverseReaction' }
  ]
};

export const getDrugs = async (req: Request, res: Response) => {
  const { item, join, fields, page, pageSize, ...params } = req.query as any;
  logQuery(item, join, fields, params, page, pageSize);

  if (!item || !allowedTables.includes(item)) {
    return res.status(400).json({ error: `Invalid item parameter. Allowed: ${allowedTables.join(', ')}` });
  }

  const fieldList = fields ? String(fields).split(',').map(f => f.trim()) : [];
  const joins = Array.isArray(join) ? join.map(String) : join ? [String(join)] : [];
  const invalidJoins = joins.filter(j => !allowedJoins[item]?.includes(j));
  if (invalidJoins.length > 0) {
    return res.status(400).json({ error: `Invalid join(s) for ${item}: ${invalidJoins.join(', ')}` });
  }

  // Separate params for ternary joins
  const ternaryParams: Record<string, any> = {};
  const nonTernaryParams: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    const baseKey = k.replace(/__op$/, '');
    const isTernary = k.includes('.') && ternaryMapping[item]?.some(t => t.incomingKeyName === k.split('.')[0]);
    (isTernary ? ternaryParams : nonTernaryParams)[k] = v;
  });

  // Extract operators map
  const operatorMap: Record<string, string> = {};
  Object.keys(params).forEach(key => {
    if (key.endsWith('__op')) {
      operatorMap[key.replace(/__op$/, '')] = params[key];
    }
  });

  const nonTernaryFields = fieldList.filter(f => !f.includes('.') || !ternaryParams[f]);
  const ternaryFields = fieldList.filter(f => f.includes('.') && ternaryParams[f]);

  const nonTernaryJoins = joins.filter(j => !ternaryMapping[item]?.some(t => t.incomingKeyName === j));
  const ternaryJoins = joins.filter(j => ternaryMapping[item]?.some(t => t.incomingKeyName === j));

  let where = buildWhere(item, nonTernaryParams, operatorMap);
  let select = buildSelect(item, nonTernaryJoins, nonTernaryFields);

  if (ternaryJoins.length) {
    if (ternaryFields.length) select = buildSelectTernary(item, ternaryJoins, ternaryFields, select);
    if (Object.keys(ternaryParams).length) where = buildWhereTernary(item, ternaryParams, operatorMap, where);
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
  const operator = operatorMap[rawKey] ||
    (numericFields.includes(field) ? 'equals' : 'contains');
  const val = numericFields.includes(field) ? Number(value) : value;
  const result: any = { [operator]: val };
  if (operator === 'contains' || operator === 'startsWith' || operator === 'endsWith') {
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

const buildSelectTernary = (item: string, joins: string[], fields: string[], existingSelect: any): any => {
  fields.forEach(field => {
    if (field.includes('.')) { 
      const [tableName, fieldName] = field.split('.');
      const ternary = ternaryMapping[item]?.find(t => t.incomingKeyName === tableName);
      const relationNameSchema = ternary?.schemaKeyName;
      const relationFieldName = ternary?.relationFieldName;

      if (relationNameSchema && relationFieldName) {
        // Ensure the nested structure exists
        if (!existingSelect[relationNameSchema]) {
          existingSelect[relationNameSchema] = { select: {} };
        }
        if (!existingSelect[relationNameSchema].select[relationFieldName]) {
          existingSelect[relationNameSchema].select[relationFieldName] = { select: {} };
        }
        // Add the field without overwriting others
        existingSelect[relationNameSchema].select[relationFieldName].select[fieldName] = true;
      }
    }
  });
  return existingSelect;
}



const mapOutput = (item: string, data: any): any => {
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

const logQuery = (
  item: any,
  join: any,
  fields: any,
  params: any,
  page: any,
  pageSize: any
) => {
  console.log(`Item: ${item}`);
  console.log(`Join: ${join}`);
  console.log(`Fields: ${fields}`);
  console.log(`Params: ${JSON.stringify(params)}`);
  console.log(`Page: ${page}`);
  console.log(`Page Size: ${pageSize}`);
}
