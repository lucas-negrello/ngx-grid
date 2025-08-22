import {NgxPaginationMode} from './types';
import {NgxPageChange, NgxServerFetcher} from './ngx-pagination.model';
import {Observable} from 'rxjs';

export interface NgxGridApi<T = any> {
  // Pagination methods
  setPaginationMode(mode: NgxPaginationMode): void;
  getPaginationMode(): NgxPaginationMode;

  setPageIndex(index: number): void;
  setPageSize(size: number): void;
  nextPage(): void;
  prevPage(): void;
  firstPage(): void;
  lastPage(): void;

  setClientData(rows: T[]): void;
  setServerFetcher(fetcher: NgxServerFetcher<T> | null): void;
  refresh(opts?: NgxPageRefreshOptions): void;

  getPageState(): NgxPageState;
  isLoading(): boolean;

  getVisibleRows(): T[];

  pageChange$: Observable<NgxPageChange>;
}

export interface NgxPageState {
  pageIndex: number;
  pageSize: number;
  total: number;
  pageCount: number
}

export interface NgxPageRefreshOptions {
  keepPage?: boolean;
}
