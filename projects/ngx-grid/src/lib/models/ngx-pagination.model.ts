import {NgxSortModelItem} from './ngx-sort.model';
import {Observable} from 'rxjs';

export interface NgxPageRequest {
  pageIndex: number;
  pageSize: number;
  sortModel?: NgxSortModelItem[];
  filterModel?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface NgxPageResult<T = any> {
  rows: T[];
  total: number;
}

export type NgxServerFetcher<T = any> = (request: NgxPageRequest) => Observable<NgxPageResult<T>>;

export interface NgxPageChange {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number;
}
