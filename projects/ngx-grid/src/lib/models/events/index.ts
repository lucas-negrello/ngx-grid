import {NgxSortModelItem} from '../ngx-sort.model';
import {NgxGridApi} from '../../api/ngx-grid-api';
import {NgxColumnFilter} from '../ngx-filter.model';

export interface NgxBaseEvent<T = any, K = any> {
  api: NgxGridApi<T>;
  event: K;
  originalEvent?: Event;
}

export interface NgxOnRowClickChangesEvent<T = any> {
  data: T;
  rowIndex: number;
}

export interface NgxOnSelectionChangesEvent<T = any> {
  selected: T[];
}

export interface NgxOnSortChangesEvent<T = any> {
  sortModel: NgxSortModelItem[];
}

export interface NgxOnPageChangesEvent<T = any> {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface NgxOnFilterChangesEvent<T = any> {
  globalText?: string;
  columnFilters?: NgxColumnFilter<T>[];
}
