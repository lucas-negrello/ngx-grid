import {
  AfterContentInit,
  Component,
  computed, ContentChildren,
  effect, inject,
  input,
  output,
  QueryList,
  signal, TrackByFunction
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {NgxColDef} from './models/ngx-col-def.model';
import {NgxGridOptions} from './models/ngx-grid-options.model';
import {NgxPaginationMode, NgxRowSelection, NgxSortDirection} from './models/types';
import {
  NgxOnPageChangedEvent,
  NgxOnRowClickedEvent,
  NgxOnSelectionChangedEvent,
  NgxOnSortChangedEvent
} from './models/events';
import {NgxCellTemplateDirective} from './directives/ngx-cell-template.directive';
import {NgxHeaderTemplateDirective} from './directives/ngx-header-template.directive';
import {NgxSortModelItem} from './models/ngx-sort.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {NgxGridApi} from './api/ngx-grid-api';
import {NgxGridDataService} from './services/ngx-grid-data/ngx-grid-data.service';
import {NgxGridColumnService} from './services/ngx-grid-column/ngx-grid-column.service';
import {NgxGridValueService} from './services/ngx-grid-value/ngx-grid-value.service';
import {NgxGridSortService} from './services/ngx-grid-sort/ngx-grid-sort.service';
import {NgxGridSelectionService} from './services/ngx-grid-selection/ngx-grid-selection.service';
import {NgxGridPaginationService} from './services/ngx-grid-pagination/ngx-grid-pagination.service';
import {NgxServerFetcher} from './models/ngx-pagination.model';

@Component({
  selector: 'ngx-grid',
  imports: [
    NgTemplateOutlet,
    NgClass
  ],
  templateUrl: './ngx-grid.component.html',
  styleUrl: './ngx-grid.component.scss',
  providers: [
    NgxGridDataService,
    NgxGridColumnService,
    NgxGridValueService,
    NgxGridSortService,
    NgxGridSelectionService,
    NgxGridPaginationService,
  ],
})
export class NgxGridComponent<T = any> implements AfterContentInit {
  // Inputs
  public readonly rowData = input<T[]>([]);
  public readonly rowData$ = input<Observable<T[]> | null>(null);
  public readonly columnDefs = input<NgxColDef<T>[]>([]);
  public readonly defaultColDef = input<Partial<NgxColDef<T>> | null>(null);
  public readonly gridOptions = input<NgxGridOptions<T> | null>(null);
  public readonly rowSelection = input<NgxRowSelection>('none');
  public readonly paginationMode = input<NgxPaginationMode>('client');
  public readonly serverFetcher = input<NgxServerFetcher<T> | null>(null);
  public readonly pageSizeOptions = input<number[]>([10, 25, 50]);

  // Outputs
  public readonly rowClicked = output<NgxOnRowClickedEvent<T>>();
  public readonly selectionChanged = output<NgxOnSelectionChangedEvent<T>>();
  public readonly sortChanged = output<NgxOnSortChangedEvent<T>>();
  public readonly pageChanged = output<NgxOnPageChangedEvent<T>>();
  public readonly apiReady = output<NgxGridApi<T>>();

  // Templates
  @ContentChildren(NgxCellTemplateDirective) cellTemplates!: QueryList<NgxCellTemplateDirective>;
  @ContentChildren(NgxHeaderTemplateDirective) headerTemplates!: QueryList<NgxHeaderTemplateDirective>;
  public cellTemplateMap = signal(new Map<string, NgxCellTemplateDirective>());
  public headerTemplateMap = signal(new Map<string, NgxHeaderTemplateDirective>());

  // Services
  private readonly _dataService: NgxGridDataService<T> = inject(NgxGridDataService);
  private readonly _columnService: NgxGridColumnService<T> = inject(NgxGridColumnService);
  private readonly _valueService: NgxGridValueService<T> = inject(NgxGridValueService);
  private readonly _sortService: NgxGridSortService<T> = inject(NgxGridSortService);
  private readonly _selectionService: NgxGridSelectionService<T> = inject(NgxGridSelectionService);
  private readonly _paginationService: NgxGridPaginationService<T> = inject(NgxGridPaginationService);

  // Derivated State
  public readonly data = this._dataService.data;
  public readonly effectiveColDefs = this._columnService.effectiveColDefs;
  public readonly processedRows = computed<T[]>(() => {
    const sorted = this._sortService.sortRows(this.data());
    return this._paginationService.apply(sorted);
  });

  public readonly selectionChanged$: Observable<NgxOnSelectionChangedEvent> =
    toObservable(computed(() => ({ selected: this._selectionService.getSelectedRows() })));
  public readonly sortChanged$: Observable<NgxSortModelItem[]> =
    toObservable(this._sortService.sortModel);

  private _streamSub: Subscription | null = null;
  private _api!: NgxGridApi<T>;

  private _emitSelectionChanges = () => effect(() => {
    const selected = this._selectionService.getSelectedRows();
    this.selectionChanged.emit({ selected });
    this.gridOptions()?.onSelectionChanged?.({ selected });
  });

  private _emitSortChanges = () => effect(() => {
    const sortModel = this._sortService.sortModel();
    this.sortChanged.emit({ sortModel });
    this.gridOptions()?.onSortChanged?.({ sortModel });
  });

  private _emitPageChanges = () => effect(() => {
    const pageOptions: NgxOnPageChangedEvent = {
      pageIndex: this._paginationService.pageIndex(),
      pageSize: this._paginationService.pageSize(),
      total: this._paginationService.total(),
      pageCount: this._paginationService.totalPages(),
    }
    this.pageChanged.emit(pageOptions);
    this.gridOptions()?.onPageChanged?.(pageOptions);
  })

  constructor() {
    this._dataService.bind(this.rowData, this.rowData$);
    this._columnService.bind(this.columnDefs, this.defaultColDef, this.gridOptions);
    this._sortService.bind(this.gridOptions);
    this._selectionService.bind(this.gridOptions, this.rowSelection, this.data);
    this._paginationService.bind(this.data, this.gridOptions()?.paginationPageSize ?? 50);

    effect(() => this._paginationService.setMode(this.paginationMode()));
    effect(() => this._paginationService.setServerFetcher(this.serverFetcher()));

    this._emitSelectionChanges();
    this._emitSortChanges();
    this._emitPageChanges();
  }

  ngAfterContentInit(): void {
    this._rebuildTemplateMaps();
    this.cellTemplates.changes.subscribe(() => this._rebuildTemplateMaps());
    this.headerTemplates.changes.subscribe(() => this._rebuildTemplateMaps());

    this._api = new NgxGridApi<T>(
      this._sortService,
      this._selectionService,
      this._paginationService,
      this._dataService,
    );
    this.apiReady.emit(this._api);
  }

  private _rebuildTemplateMaps = (): void => {
    const cellMap = new Map<string, NgxCellTemplateDirective>();
    const headerMap = new Map<string, NgxHeaderTemplateDirective>();

    this.cellTemplates?.forEach((template) =>
      cellMap.set(template.colId(), template));
    this.headerTemplates?.forEach((template) =>
      headerMap.set(template.colId(), template));

    this.cellTemplateMap.set(cellMap);
    this.headerTemplateMap.set(headerMap);
  }

  public onHeaderClick =
    (col: NgxColDef<T>, event: MouseEvent): void =>
      this._sortService.onHeaderClick(col, event);


  public getSortFor =
    (col: NgxColDef<T>): NgxSortDirection =>
      this._sortService.getSortFor(col);


  public getSortIndexFor =
    (col: NgxColDef<T>): number | null =>
      this._sortService.getSortIndexFor(col);

  public onRowClick =
    (row: T, rowIndex: number, event: MouseEvent): void => {
      this.rowClicked.emit({ data: row, rowIndex });
      this.gridOptions()?.onRowClicked?.({ data: row, rowIndex });
      this._selectionService.onRowClick(row, rowIndex);
    }

  public isSelected =
    (row: T, rowIndex: number): boolean =>
      this._selectionService.isSelected(row, rowIndex);

  public getCellRawValue =
    (row: T, col: NgxColDef<T>, rowIndex: number): T =>
      this._valueService.getCellRawValue(row, col, rowIndex);

  public getCellFormattedValue =
    (row: T, col: NgxColDef<T>, rowIndex: number): string | number | null =>
      this._valueService.getCellFormattedValue(row, col, rowIndex);

  public getCellRenderOutput =
    (row: T, col: NgxColDef<T>, rowIndex: number): string | number | null =>
      this._valueService.getCellRenderOutput(row, col, rowIndex);

  public getCellClassList =
    (row: T, col: NgxColDef<T>, rowIndex: number): string[] =>
      this._valueService.getCellClassList(row, col, rowIndex);

  public paginationTotal = (): number => this._paginationService.total();
  public paginationPageIndex = (): number => this._paginationService.pageIndex();
  public paginationTotalPages = (): number => this._paginationService.totalPages();
  public paginationPageSize = (): number => this._paginationService.pageSize();
  public onPaginationSetPageSize = (size: number): void => this._paginationService.setPageSize(size);
  public onPaginationFirst = (): void => this._paginationService.first();
  public onPaginationPrev = (): void => this._paginationService.prev();
  public onPaginationNext = (): void => this._paginationService.next();
  public onPaginationLast = (): void => this._paginationService.last();

  public trackRow: TrackByFunction<T> = (i, item) => i;

  protected readonly String = String;
}
