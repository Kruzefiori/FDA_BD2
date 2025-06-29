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

const ternaryTables = [
  'adverseReaction',
  'report'
]

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
  adverseReaction: ['drugs', 'report'],
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
  // plural
  adverseReactions: ['name'],
  drugs: ['id', 'companyName', 'drugName'],
  Product: ['id', 'activeIngredientName', 'activeIngredientStrength', 'dosageForm', 'route', 'drugId'],
};

type Ternary = {
  incomingKeyName: string;
  schemaKeyName: string;
  relationName: string;
  relationFieldName: string;
}

const ternaryMapping: Record<string, Array<Ternary>> = {
  adverseReaction: [
    {
      incomingKeyName: 'drugs',
      schemaKeyName: 'drugs',
      relationName: 'RelAdverseReactionXDrug',
      relationFieldName: 'Drug'
    },
    {
      incomingKeyName: 'report',
      schemaKeyName: 'reportDrugs',
      relationName: 'RelAdverseReactionXReport',
      relationFieldName: 'Report'
    }
  ],
  report: [
    {
      incomingKeyName: 'drugs',
      schemaKeyName: 'drugs',
      relationName: 'RelReportXDrug',
      relationFieldName: 'Drug'
    },
    {
      incomingKeyName: 'adverseReactions',
      schemaKeyName: 'adverseReactions',
      relationName: 'RelAdverseReactionXReport',
      relationFieldName: 'AdverseReaction'
    }
  ]
}


export const getDrugs = async (req: Request, res: Response) => {
  const { item, join, fields, page, pageSize, ...params } = req.query;

  logQuery(item, join, fields, params, page, pageSize);

  if (!item || typeof item !== 'string' || !allowedTables.includes(item)) {
    return res.status(400).json({ error: 'Invalid item parameter. Allowed items are: ' + allowedTables.join(', ') });
  }

  [page, pageSize].forEach(param => {
    if (param && typeof param !== 'string' && typeof param !== 'number') {
      return res.status(400).json({ error: `Invalid parameter ${param}. It should be a string or number.` });
    }
  });

  const allowedFieldsInTable: Record<string, Array<string>> = {
    "base": allowedFields[item] || [],
  };

  allowedJoins[item].forEach(joinName => {
    allowedFieldsInTable[joinName] = allowedFields[joinName] || [];
  })

  // console.dir(allowedFieldsInTable, { depth: null });

  /*
  const invalidFields = [];
  for (const field of Object.keys(params)) {
    if (!allowedFieldsInTable[item].includes(field) && !allowedFieldsInTable.base.includes(field)) {
      invalidFields.push(field);
    }
  }

  if (invalidFields.length > 0) {
    return res.status(400).json({
      error: `Invalid fields for ${item}: ${invalidFields.join(', ')}. Allowed fields are: ${allowedFieldsInTable.join(', ')}`,
    });
  } */
 
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

  // separate params that are form ternary relations
  // first get params keys that have a . and then pick the item behind the .
  // once that is done we check if the item is in the ternaryMapping
  let ternaryParams: Record<string, any> = {};
  let nonTernaryParams: Record<string, any> = {};
  for (const key in params) {
    if (key.includes('.')) {
      const [relation, field] = key.split('.');
      if (ternaryMapping[item]?.some(t => t.incomingKeyName === relation)) {
        // this is a ternary relation
        ternaryParams[key] = params[key];
      } else {
        // this is not a ternary relation, remove it from params
        nonTernaryParams[key] = params[key];
      }
    } else {
      // this is a direct field, keep it in non-ternary params
      nonTernaryParams[key] = params[key];
    }
  }
  console.log('Ternary Params:', ternaryParams);
  console.log('Non-Ternary Params:', nonTernaryParams);

  console.log('----------------------------------');

  // separate fields between ternary and non-ternary relations
  let ternaryFields: string[] = [];
  let nonTernaryFields: string[] = [];
  fieldList.forEach(field => {
    if (field.includes('.')) {
      const [relation, fieldName] = field.split('.');
      if (ternaryMapping[item]?.some(t => t.incomingKeyName === relation)) {
        // this is a ternary relation
        ternaryFields.push(field);
      } else {
        // this is not a ternary relation, remove it from fields
        nonTernaryFields.push(field);
      }
    } else {
      nonTernaryFields.push(field);
    }
  });

  console.log('Ternary Fields:', ternaryFields);
  console.log('Non-Ternary Fields:', nonTernaryFields); 
  console.log('----------------------------------');

  // separate joins that are ternary relations
  const ternaryJoins = joins.filter(j => ternaryMapping[item]?.some(t => t.incomingKeyName === j));
  const nonTernaryJoins = joins.filter(j => !ternaryMapping[item]?.some(t => t.incomingKeyName === j));

  let where = buildWhere(item, nonTernaryParams, allowedFieldsInTable.base);
  let select = buildSelect(item, nonTernaryJoins, nonTernaryFields);


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

  for (const key in params) {
    if (key.includes('.')) {
      // Nested filter: e.g., Drug.companyName
      const [relation, field] = key.split('.');
      where[relation] = where[relation] || {};
      where[relation][field] = {
        contains: params[key],
        mode: 'insensitive'
      };
    } else if (allowedItems.includes(key)) {
      // Existing logic for direct fields
      if (rangeAllowed.includes(key) && params[key] !== undefined) {
        // ...existing range logic...
      } else if (params[key]) {
        where[key] = {
          contains: params[key],
          mode: 'insensitive'
        };
      }
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

const buildSelectTernary = (item: string, joins: string[], fields: string[]): any => {
  const select: any = {};

  select

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