import {NgxGridSortService} from '../services/ngx-grid-sort/ngx-grid-sort.service';
import {NgxGridSelectionService} from '../services/ngx-grid-selection/ngx-grid-selection.service';
import {NgxGridPaginationService} from '../services/ngx-grid-pagination/ngx-grid-pagination.service';
import {NgxSortModelItem} from '../models/ngx-sort.model';

export class NgxGridApi<T = any> {
  constructor(
    private readonly _sort: NgxGridSortService<T>,
    private readonly _selection: NgxGridSelectionService<T>,
    private readonly _pagination: NgxGridPaginationService<T>,
  ) {}

  // Sort API Functions
  public getSortModel = (): NgxSortModelItem[] => this._sort.sortModel();
  public setSortModel = (model: NgxSortModelItem[]): void => this._sort.setSortModel(model);
  public clearSort = (): void => this._sort.clearSort();

  // Selection API Functions
  public getSelectedRows = (): T[] => this._selection.getSelectedRows();
  public clearSelection = (): void => this._selection.clearSelection();

  // Pagination API Functions
  public getPageIndex = (): number => this._pagination.pageIndex();
  public getPageSize = (): number => this._pagination.pageSize();
  public getTotalPages = (): number => this._pagination.totalPages();
  public setPageIndex = (index: number): void => this._pagination.setPageIndex(index);
  public setPageSize = (size: number): void => this._pagination.setPageSize(size);
  public nextPage = (): void => this._pagination.next();
  public prevPage = (): void => this._pagination.prev();
}
