import {NgxFilterOperator} from './types';

export interface NgxColumnFilter<T = any> {
  colId: string | number;
  operator: NgxFilterOperator;
  value?: any;
  caseSensitive?: boolean;
}

export interface NgxFilterModel<T = any> {
  globalText?: string;
  columnFilters?: NgxColumnFilter<T>[];
}
