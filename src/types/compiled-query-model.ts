export interface CompiledQueryModel {
  language: 'sql' | 'python';
  definition: string;
  placeholders: Record<string, any>;
}
