export interface ParameterOptionModel {
  id: string;
  label: string;
}

export interface ParameterBaseModel {
  name: string;
  label: string;
  description: string;
  widget_type: string;
}

export interface NoneParameterModel extends ParameterBaseModel {
  widget_type: 'none';
}

export interface SingleSelectParameterModel extends ParameterBaseModel {
  widget_type: 'single_select';
  options: ParameterOptionModel[];
  trigger_refresh: boolean;
  selected_id: string | null;
}

export interface MultiSelectParameterModel extends ParameterBaseModel {
  widget_type: 'multi_select';
  options: ParameterOptionModel[];
  trigger_refresh: boolean;
  show_select_all: boolean;
  order_matters: boolean;
  selected_ids: string[];
}

export interface DateParameterModel extends ParameterBaseModel {
  widget_type: 'date';
  min_date: string | null;
  max_date: string | null;
  selected_date: string;
}

export interface DateRangeParameterModel extends ParameterBaseModel {
  widget_type: 'date_range';
  min_date: string | null;
  max_date: string | null;
  selected_start_date: string;
  selected_end_date: string;
}

export interface NumberParameterModel extends ParameterBaseModel {
  widget_type: 'number';
  min_value: number;
  max_value: number;
  increment: number;
  selected_value: number;
}

export interface NumberRangeParameterModel extends ParameterBaseModel {
  widget_type: 'number_range';
  min_value: number;
  max_value: number;
  increment: number;
  selected_lower_value: number;
  selected_upper_value: number;
}

export interface TextParameterModel extends ParameterBaseModel {
  widget_type: 'text';
  entered_text: string;
  input_type: string;
}

export type AnyParameterModel =
  | NoneParameterModel
  | SingleSelectParameterModel
  | MultiSelectParameterModel
  | DateParameterModel
  | DateRangeParameterModel
  | NumberParameterModel
  | NumberRangeParameterModel
  | TextParameterModel;

export interface ColumnWithConditionModel {
  name: string;
  type: string;
  description: string;
  category: string;
  condition: string | null;
}

export interface SchemaWithConditionModel {
  fields: ColumnWithConditionModel[];
}

export interface DatasetItemModel {
  name: string;
  name_for_api: string;
  label: string;
  description: string;
  parameters: string[];
  schema: SchemaWithConditionModel;
}

export interface DashboardItemModel extends DatasetItemModel {
  result_format: 'png' | 'html';
}

export interface ColumnConfig {
  name: string;
  type?: string;
  description?: string;
  condition?: string[];
  category?: 'dimension' | 'measure' | 'misc';
  depends_on?: string[];
  pass_through?: boolean;
}

export interface ModelConfig {
  description?: string;
  columns?: ColumnConfig[];
  connection?: string | null;
  table?: string;
}

export interface DataModelItem {
  name: string;
  model_type: 'source' | 'dbview' | 'federate' | 'seed' | 'build';
  config: ModelConfig;
  is_queryable: boolean;
}

export interface ConnectionItem {
  name: string;
  label: string;
}

interface LineageNode {
  name: string;
  type: 'dataset' | 'dashboard' | 'model';
}

interface LineageItem {
  type: 'buildtime' | 'runtime';
  source: LineageNode;
  target: LineageNode;
}

interface ConfigurablesItem {
  name: string;
  label: string;
  default: string;
  description: string;
}

export interface ParametersResponse {
  parameters: AnyParameterModel[];
}
  
export interface DataCatalogResponse {
  parameters: AnyParameterModel[];
  datasets: DatasetItemModel[];
  dashboards: DashboardItemModel[];
  models?: DataModelItem[];
  connections?: ConnectionItem[];
  lineage?: LineageItem[];
  configurables?: ConfigurablesItem[];
}
