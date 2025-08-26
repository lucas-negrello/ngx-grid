import {NgxGridSortService} from '../services/ngx-grid-sort/ngx-grid-sort.service';
import {NgxGridSelectionService} from '../services/ngx-grid-selection/ngx-grid-selection.service';
import {NgxGridPaginationService} from '../services/ngx-grid-pagination/ngx-grid-pagination.service';
import {NgxSortModelItem} from '../models/ngx-sort.model';
import {NgxGridDataService} from '../services/ngx-grid-data/ngx-grid-data.service';
import {NgxPaginationMode} from '../models/types';
import {NgxPageRefreshOptions, NgxPageState, NgxServerFetcher} from '../models/ngx-pagination.model';
import {map, Observable} from 'rxjs';
import {
  NgxBaseEvent, NgxOnFilterChangesEvent,
  NgxOnPageChangesEvent,
  NgxOnSelectionChangesEvent,
  NgxOnSortChangesEvent
} from '../models/events';
import {NgxApiModel} from '../models/ngx-api.model';
import {NgxGridFilterService} from '../services/ngx-grid-filter/ngx-grid-filter.service';
import {NgxColumnFilter, NgxFilterModel} from '../models/ngx-filter.model';

export class NgxGridApi<T = any> implements NgxApiModel<T> {
  public readonly pageChanges$: Observable<NgxBaseEvent<T, NgxOnPageChangesEvent<T>>>;
  public readonly sortChanges$: Observable<NgxBaseEvent<T, NgxOnSortChangesEvent<T>>>;
  public readonly selectionChanges$: Observable<NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>>>;
  public readonly filterChanges$: Observable<NgxBaseEvent<T, NgxOnFilterChangesEvent<T>>>;
  constructor(
    private readonly _sort: NgxGridSortService<T>,
    private readonly _selection: NgxGridSelectionService<T>,
    private readonly _pagination: NgxGridPaginationService<T>,
    private readonly _filter: NgxGridFilterService<T>,
    private readonly _data: NgxGridDataService<T>,
  ) {
    this.pageChanges$ = this._pagination.pageChanges$.pipe(
      map((event): NgxBaseEvent<T, NgxOnPageChangesEvent<T>> => ({ api: this, event }))
    );
    this.sortChanges$ = this._sort.sortChanges$.pipe(
      map((event): NgxBaseEvent<T, NgxOnSortChangesEvent<T>> => ({ api: this, event }))
    );
    this.selectionChanges$ = this._selection.selectionChanges$.pipe(
      map((event): NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>> => ({ api: this, event }))
    );
    this.filterChanges$ = this._filter.filterChanges$.pipe(
      map((event): NgxBaseEvent<T, NgxOnFilterChangesEvent<T>> => ({ api: this, event }))
    );
  }

  // Sort API Functions
  public getSortModel = (): NgxSortModelItem[] => this._sort.sortModel();
  public setSortModel = (model: NgxSortModelItem[]): void => this._sort.setSortModel(model);
  public clearSort = (): void => this._sort.clearSort();

  // Filter API Functions
  setGlobalFilter(text: string): void {
    this._filter.setGlobalText(text);
  }

  setColumnFilter(filter: NgxColumnFilter<T>): void {
    this._filter.setColumnFilter(filter);
  }

  clearColumnFilter(colId: string | number): void {
    this._filter.clearColumnFilter(colId);
  }

  clearAllFilters(): void {
    this._filter.clearAll();
  }

  getFilterModel(): NgxFilterModel<T> {
    return this._filter.getFilterModel();
  }

  // Selection API Functions
  public getSelectedRows = (): T[] => this._selection.getSelectedRows();
  public clearSelection = (): void => this._selection.clearSelection();

  // Pagination API Functions
  public setPaginationMode = (mode: NgxPaginationMode): void => this._pagination.setMode(mode);
  public getPaginationMode = (): NgxPaginationMode => this._pagination.mode();
  public getPageIndex = (): number => this._pagination.pageIndex();
  public getPageSize = (): number => this._pagination.pageSize();
  public getTotalPages = (): number => this._pagination.totalPages();
  public setPageIndex = (index: number): void => this._pagination.setPageIndex(index);
  public setPageSize = (size: number): void => this._pagination.setPageSize(size);
  public nextPage = (): void => this._pagination.next();
  public prevPage = (): void => this._pagination.prev();
  public firstPage = (): void => this._pagination.first();
  public lastPage = (): void => this._pagination.last();
  public setServerFetcher = (fetcher: NgxServerFetcher<T> | null) =>
    this._pagination.setServerFetcher(fetcher);
  public refresh = (opts?: NgxPageRefreshOptions): void =>
    this._pagination.refresh(opts);
  public getPageState = (): NgxPageState => ({
    pageIndex: this._pagination.pageIndex(),
    pageSize: this._pagination.pageSize(),
    total: this._pagination.totalPages(),
    pageCount: this._pagination.totalPages(),
  });
  public getVisibleRows = (): T[] => {
    const sorted = this._sort.sortRows(this._data.data());
    return this._pagination.apply(sorted);
  }
}
