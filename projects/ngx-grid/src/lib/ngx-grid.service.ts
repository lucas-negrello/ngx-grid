import {computed, effect, inject, Injectable, QueryList, signal, TrackByFunction} from '@angular/core';
import {NgxCellTemplateDirective} from './directives/ngx-cell-template.directive';
import {NgxHeaderTemplateDirective} from './directives/ngx-header-template.directive';
import {NgxGridDataService} from './services/ngx-grid-data/ngx-grid-data.service';
import {NgxGridColumnService} from './services/ngx-grid-column/ngx-grid-column.service';
import {NgxGridValueService} from './services/ngx-grid-value/ngx-grid-value.service';
import {NgxGridSortService} from './services/ngx-grid-sort/ngx-grid-sort.service';
import {NgxGridSelectionService} from './services/ngx-grid-selection/ngx-grid-selection.service';
import {NgxGridPaginationService} from './services/ngx-grid-pagination/ngx-grid-pagination.service';
import {NgxGridInputs, NgxGridOutputs} from './models/ngx-grid-service.model';
import {NgxGridApi} from './api/ngx-grid-api';
import {
  NgxBaseEvent, NgxOnPageChangesEvent,
  NgxOnRowClickChangesEvent, NgxOnSelectionChangesEvent, NgxOnSortChangesEvent
} from './models/events';
import {NgxColDef} from './models/ngx-col-def.model';
import {NgxSortDirection} from './models/types';
import {NgxGridFilterService} from './services/ngx-grid-filter/ngx-grid-filter.service';
import {NgxColumnFilter} from './models/ngx-filter.model';

@Injectable()
export class NgxGridService<T = any> {
  // Template Maps
  public readonly cellTemplateMap = signal(new Map<string, NgxCellTemplateDirective>());
  public readonly headerTemplateMap = signal(new Map<string, NgxHeaderTemplateDirective>());

  // SubServices
  private readonly _dataService: NgxGridDataService<T> = inject(NgxGridDataService);
  private readonly _columnService: NgxGridColumnService<T> = inject(NgxGridColumnService);
  private readonly _valueService: NgxGridValueService<T> = inject(NgxGridValueService);
  private readonly _sortService: NgxGridSortService<T> = inject(NgxGridSortService);
  private readonly _selectionService: NgxGridSelectionService<T> = inject(NgxGridSelectionService);
  private readonly _paginationService: NgxGridPaginationService<T> = inject(NgxGridPaginationService);
  private readonly _filterService: NgxGridFilterService<T> = inject(NgxGridFilterService);

  // Derivated State
  public readonly data = this._dataService.data;
  public readonly effectiveColDefs = this._columnService.effectiveColDefs;
  public readonly filteredRows = computed<T[]>(() => this._filterService.apply(this.data()));
  public readonly processedRows = computed<T[]>(() => {
    const sorted = this._sortService.sortRows(this.filteredRows());
    return this._paginationService.apply(sorted);
  });

  private _inputs!: NgxGridInputs<T>;
  private _outputs!: NgxGridOutputs<T>;
  private _api!: NgxGridApi<T>;

  public get __inputs() { return this._inputs; }

  private _emitSelectionChanges =
    (inputs: NgxGridInputs<T>, outputs: NgxGridOutputs<T>) =>
      effect(() => {
        const selectedOptions: NgxOnSelectionChangesEvent<T> = { selected: this._selectionService.getSelectedRows()};
        const emitValues: NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>> = {
          api: this._api,
          event: selectedOptions
        };
        outputs.selectionChanged.emit(emitValues);
        inputs.gridOptions()?.onSelectionChanges?.(emitValues);
      });

  private _emitSortChanges =
    (inputs: NgxGridInputs<T>, outputs: NgxGridOutputs<T>) =>
      effect(() => {
        const sortModelOptions: NgxOnSortChangesEvent<T> = { sortModel: this._sortService.sortModel() };
        const emitValues: NgxBaseEvent<T, NgxOnSortChangesEvent<T>> = {
          api: this._api,
          event: sortModelOptions
        };
        outputs.sortChanged.emit(emitValues);
        inputs.gridOptions()?.onSortChanges?.(emitValues);
      });

  private _emitPageChanges =
    (inputs: NgxGridInputs<T>, outputs: NgxGridOutputs<T>) =>
      effect(() => {
        const pageOptions: NgxOnPageChangesEvent = {
          pageIndex: this._paginationService.pageIndex(),
          pageSize: this._paginationService.pageSize(),
          total: this._paginationService.total(),
          pageCount: this._paginationService.totalPages(),
        }
        const emitValues: NgxBaseEvent<T, NgxOnPageChangesEvent<T>> = {
          api: this._api,
          event: pageOptions
        };
        outputs.pageChanged.emit(emitValues);
        inputs.gridOptions()?.onPageChanges?.(emitValues);
      });

  private _emitFilterChanges =
    (inputs: NgxGridInputs<T>, outputs: NgxGridOutputs<T>) =>
      effect(() => {
        const emitValues = {
          api: this._api,
          event: {
            globalText: this._filterService.getGlobalText(),
            columnFilters: this._filterService.getColumnFilters(),
          }
        };
        outputs.filterChanged?.emit(emitValues);
        inputs.gridOptions()?.onFilterChanges?.(emitValues);
      });

  public bind = (inputs: NgxGridInputs<T>, outputs: NgxGridOutputs<T>): void => {
    this._inputs = inputs;
    this._outputs = outputs;

    this._dataService.bind(inputs.rowData, inputs.rowData$);
    this._columnService.bind(inputs.columnDefs, inputs.defaultColDef, inputs.gridOptions);
    this._sortService.bind(inputs.gridOptions);
    this._selectionService.bind(inputs.gridOptions, inputs.rowSelection, this.data);
    this._paginationService.bind(this.data, inputs.gridOptions()?.paginationPageSize ?? 25);
    this._filterService.bind(this.effectiveColDefs, inputs.gridOptions, this._valueService, inputs.filterText, inputs.columnFilters);

    effect(() => {
      this._paginationService.setTotalOverride(this.filteredRows().length);
    });

    effect(() => {
      const size = inputs.gridOptions()?.paginationPageSize ?? 25;
      this._paginationService.setPageSize(size);
    });

    effect(() => this._paginationService.setMode(inputs.paginationMode()));
    effect(() => this._paginationService.setServerFetcher(inputs.serverFetcher()));

    this._emitSelectionChanges(inputs, outputs);
    this._emitSortChanges(inputs, outputs);
    this._emitPageChanges(inputs, outputs);
    this._emitFilterChanges(inputs, outputs);

  }

  public afterContentInit = (
    cellTemplates: QueryList<NgxCellTemplateDirective>,
    headerTemplates: QueryList<NgxHeaderTemplateDirective>
  ): void => {
    this._rebuildTemplateMaps(cellTemplates, headerTemplates);
    cellTemplates.changes.subscribe(() => this._rebuildTemplateMaps(cellTemplates, headerTemplates));
    headerTemplates.changes.subscribe(() => this._rebuildTemplateMaps(cellTemplates, headerTemplates));

    this._api = new NgxGridApi<T>(
      this._sortService,
      this._selectionService,
      this._paginationService,
      this._filterService,
      this._dataService,
    );
    this._outputs.apiReady.emit(this._api);
  }

  private _rebuildTemplateMaps = (
    cellTemplates: QueryList<NgxCellTemplateDirective>,
    headerTemplates: QueryList<NgxHeaderTemplateDirective>
  ): void => {
    const cellMap = new Map<string, NgxCellTemplateDirective>();
    const headerMap = new Map<string, NgxHeaderTemplateDirective>();

    cellTemplates?.forEach((template) => cellMap.set(template.colId(), template));
    headerTemplates?.forEach((template) => headerMap.set(template.colId(), template));

    this.cellTemplateMap.set(cellMap);
    this.headerTemplateMap.set(headerMap);
  }

  public isColumnFilterEnabled =
    (col: NgxColDef<T>): boolean => {
      const global = this._inputs.gridOptions()?.enableColumnFilter ?? true;
      if (typeof col.filter === 'boolean') return global && col.filter;
      const enabled = col.filter?.enabled;
      return global && (enabled ?? true);
    };

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
      const clickOptions: NgxOnRowClickChangesEvent<T> = {
        data: row,
        rowIndex,
      };
      const emitValues: NgxBaseEvent<T, NgxOnRowClickChangesEvent<T>> = {
        api: this._api,
        event: clickOptions,
        originalEvent: event,
      }
      this._outputs.rowClicked.emit(emitValues);
      this._inputs.gridOptions()?.onRowClickChanges?.(emitValues);
      this._selectionService.onRowClick(row, rowIndex);
    };

  public setGlobalFilter =
    (text: string) =>
      this._filterService.setGlobalText(text);

  public setColumnFilter =
    (filter: NgxColumnFilter<T>) =>
      this._filterService.setColumnFilter(filter);

  public clearColumnFilter =
    (colId: string | number) =>
      this._filterService.clearColumnFilter(colId);

  public clearAllFilters =
    () =>
      this._filterService.clearAll();

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
  public trackRow: TrackByFunction<T> = (i, item) => {
    const getRowId = this._inputs.gridOptions()?.getRowId;
    if (getRowId) {
      try {
        const key = getRowId({data: item as T, index: i});
        if (key !== undefined && key !== null) return key;
      } catch {

      }
    }
    const id = (item as any)?.id;
    return id ?? i;
  };
}
