export interface Difference {
  key: string;
  baseValue: unknown;
  compareValue: unknown;
}

export interface CompareOptions {
  wildcard?: string[];
  matchBy?: string;
}
