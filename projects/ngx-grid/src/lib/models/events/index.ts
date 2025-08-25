import {NgxSortModelItem} from '../ngx-sort.model';
import {NgxGridApi} from '../../api/ngx-grid-api';

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
