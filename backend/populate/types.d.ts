interface ApiResponseResults {
  skip: number
  limit: number
  total: number
}

interface ApiResponseMeta {
  disclaimer: string
  terms: string
  license: string
  last_updated: string
  results?: ApiResponseResults;
}

interface ApiResponse<T> {
  results: T[];
  meta?: ApiResponseMeta;
}

interface FetchOptions {
  timeout: number;
  retryDelay: number;
  maxRetries: number;
  requestDelay: number;
  maxRequestPerKey: number;
}

// Api Response Types

interface ActiveIngredient {
  name: string
  strength: string
}

interface Medicamento {
  submissions: Submission[]
  application_number: string
  sponsor_name: string
  openfda: Openfda
  products: Product[]
}

interface Submission {
  submission_type: string
  submission_number: string
  submission_status: string
  submission_status_date: string
  review_priority?: string
  submission_class_code?: string
  submission_class_code_description?: string
  application_docs?: ApplicationDoc[]
}

interface ApplicationDoc {
  id: string
  url: string
  date: string
  type: string
}

interface Openfda {
  application_number: string[]
  brand_name: string[]
  generic_name: string[]
  manufacturer_name: string[]
  product_ndc: string[]
  product_type: string[]
  route: string[]
  substance_name: string[]
  rxcui: string[]
  spl_id: string[]
  spl_set_id: string[]
  package_ndc: string[]
  nui: string[]
  pharm_class_epc: string[]
  unii: string[]
}

export interface Product {
  product_number: string
  reference_drug: string
  brand_name: string
  active_ingredients: ActiveIngredient[]
  reference_standard: string
  dosage_form: string
  route: string
  marketing_status: string
  te_code: string
}

interface Shortage {
  discontinued_date: string
  update_type: string
  initial_posting_date: string
  proprietary_name: string
  strength: string[]
  package_ndc: string
  generic_name: string
  contact_info: string
  openfda: Openfda
  update_date: string
  therapeutic_category: string[]
  dosage_form: string
  presentation: string
  company_name: string
  status: string
  shortage_reason?: string
}

interface Openfda {
  application_number: string[]
  brand_name: string[]
  generic_name: string[]
  manufacturer_name: string[]
  product_ndc: string[]
  product_type: string[]
  route: string[]
  substance_name: string[]
  rxcui: string[]
  spl_id: string[]
  spl_set_id: string[]
  package_ndc: string[]
  nui: string[]
  pharm_class_moa: string[]
  pharm_class_epc: string[]
  unii: string[]
}

interface TermOccurrence {
  term: string
  count: number
}

// Functions
interface LinkActiveIngredientToDrug {
  activeIngredient: ActiveIngredient;
  drug: Pick<Drug, "id">;
  dosageForm?: string;
  route?: string;
}

interface ProcessDrugActiveIngredients {
  product: Product;
  drug: Drug;
}

interface ShortageRecord {
  drug: Pick<Drug, "drugName">;
  shortage: Shortage;
}
