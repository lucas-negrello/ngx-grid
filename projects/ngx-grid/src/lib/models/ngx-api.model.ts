import {NgxSortModelItem} from './ngx-sort.model';
import {NgxPaginationMode} from './types';
import {NgxPageRefreshOptions, NgxPageState, NgxServerFetcher} from './ngx-pagination.model';
import {Observable} from 'rxjs';
import {
  NgxBaseEvent, NgxOnFilterChangesEvent, NgxOnPageChangesEvent,
  NgxOnSelectionChangesEvent, NgxOnSortChangesEvent
} from './events';
import {NgxColumnFilter, NgxFilterModel} from './ngx-filter.model';

export interface NgxApiModel<T = any> {
  // Sort
  getSortModel: () => NgxSortModelItem[];
  setSortModel: (model: NgxSortModelItem[]) => void;
  clearSort: () => void;

  // Filter
  setGlobalFilter: (text: string) => void;
  setColumnFilter: (filter: NgxColumnFilter<T>) => void;
  clearColumnFilter: (colId: string | number) => void;
  clearAllFilters: () => void;
  getFilterModel: () => NgxFilterModel<T>;

  // Selection
  getSelectedRows: () => T[];
  clearSelection: () => void;

  // Pagination
  setPaginationMode: (mode: NgxPaginationMode) => void;
  getPaginationMode: () => NgxPaginationMode;
  getPageIndex: () => number;
  getPageSize: () => number;
  getTotalPages: () => number;
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;

  // Server-side
  setServerFetcher: (fetcher: NgxServerFetcher<T> | null) => void;
  refresh: (opts?: NgxPageRefreshOptions) => void;

  // State and Visible Rows
  getPageState: () => NgxPageState;
  getVisibleRows: () => T[];

  // Events
  readonly pageChanges$: Observable<NgxBaseEvent<T, NgxOnPageChangesEvent<T>>>;
  readonly selectionChanges$: Observable<NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>>>;
  readonly sortChanges$: Observable<NgxBaseEvent<T, NgxOnSortChangesEvent<T>>>;
  readonly filterChanges$: Observable<NgxBaseEvent<T, NgxOnFilterChangesEvent<T>>>;
}
