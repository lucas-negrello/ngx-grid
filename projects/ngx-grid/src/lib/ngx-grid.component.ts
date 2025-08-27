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
import {Observable} from 'rxjs';
import {NgxColDef} from './models/ngx-col-def.model';
import {NgxGridOptions} from './models/ngx-grid-options.model';
import {NgxPaginationMode, NgxRowSelection, NgxSortDirection} from './models/types';
import {
  NgxBaseEvent, NgxOnFilterChangesEvent,
  NgxOnPageChangesEvent,
  NgxOnRowClickChangesEvent,
  NgxOnSelectionChangesEvent,
  NgxOnSortChangesEvent
} from './models/events';
import {NgxCellTemplateDirective} from './directives/ngx-cell-template.directive';
import {NgxHeaderTemplateDirective} from './directives/ngx-header-template.directive';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {NgxGridApi} from './api/ngx-grid-api';
import {NgxGridDataService} from './services/ngx-grid-data/ngx-grid-data.service';
import {NgxGridColumnService} from './services/ngx-grid-column/ngx-grid-column.service';
import {NgxGridValueService} from './services/ngx-grid-value/ngx-grid-value.service';
import {NgxGridSortService} from './services/ngx-grid-sort/ngx-grid-sort.service';
import {NgxGridSelectionService} from './services/ngx-grid-selection/ngx-grid-selection.service';
import {NgxGridPaginationService} from './services/ngx-grid-pagination/ngx-grid-pagination.service';
import {NgxServerFetcher} from './models/ngx-pagination.model';
import {NgxGridService} from './ngx-grid.service';
import {NgxGridFilterService} from './services/ngx-grid-filter/ngx-grid-filter.service';
import {NgxColumnFilter} from './models/ngx-filter.model';
import {NgxColumnFilterComponent} from './components/ngx-column-filter/ngx-column-filter.component';

@Component({
  selector: 'ngx-grid',
  imports: [
    NgTemplateOutlet,
    NgClass,
    NgxColumnFilterComponent
  ],
  templateUrl: './ngx-grid.component.html',
  styleUrl: './ngx-grid.component.scss',
  providers: [
    // Existent Scope Providers
    NgxGridDataService,
    NgxGridColumnService,
    NgxGridValueService,
    NgxGridSortService,
    NgxGridSelectionService,
    NgxGridPaginationService,
    NgxGridFilterService,
    // Facade Service Provider
    NgxGridService
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
  public readonly filterText = input<string>('');
  public readonly columnFilters = input<NgxColumnFilter<T>[] | Record<string, any> | null>(null);

  // Outputs
  public readonly rowClicked = output<NgxBaseEvent<T, NgxOnRowClickChangesEvent<T>>>();
  public readonly selectionChanged = output<NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>>>();
  public readonly sortChanged = output<NgxBaseEvent<T, NgxOnSortChangesEvent<T>>>();
  public readonly pageChanged = output<NgxBaseEvent<T, NgxOnPageChangesEvent<T>>>();
  public readonly filterChanged = output<NgxBaseEvent<T, NgxOnFilterChangesEvent<T>>>();
  public readonly apiReady = output<NgxGridApi<T>>();

  // Templates
  @ContentChildren(NgxCellTemplateDirective) cellTemplates!: QueryList<NgxCellTemplateDirective>;
  @ContentChildren(NgxHeaderTemplateDirective) headerTemplates!: QueryList<NgxHeaderTemplateDirective>;

  // Grid Service
  public readonly grid = inject(NgxGridService<T>);

  // Signals/States for Template
  public readonly data = this.grid.data;
  public readonly effectiveColDefs = this.grid.effectiveColDefs;
  public readonly processedRows = this.grid.processedRows;
  public readonly cellTemplateMap = this.grid.cellTemplateMap;
  public readonly headerTemplateMap = this.grid.headerTemplateMap;

  // Bind Inputs and Outputs to Service
  constructor() {
   this.grid.bind(
     {
       rowData: this.rowData,
       rowData$: this.rowData$,
       columnDefs: this.columnDefs,
       defaultColDef: this.defaultColDef,
       gridOptions: this.gridOptions,
       rowSelection: this.rowSelection,
       paginationMode: this.paginationMode,
       serverFetcher: this.serverFetcher,
       pageSizeOptions: this.pageSizeOptions,
       filterText: this.filterText,
       columnFilters: this.columnFilters,
     },
     {
       rowClicked: this.rowClicked,
       selectionChanged: this.selectionChanged,
       sortChanged: this.sortChanged,
       pageChanged: this.pageChanged,
       filterChanged: this.filterChanged,
       apiReady: this.apiReady,
     }
   )
  }
  ngAfterContentInit(): void {
    this.grid.afterContentInit(this.cellTemplates, this.headerTemplates);
  }

  // Public Handlers and Helpers
  public onHeaderClick = (col: NgxColDef<T>, event: MouseEvent): void =>
    this.grid.onHeaderClick(col, event);

  public getSortFor = (col: NgxColDef<T>): NgxSortDirection =>
    this.grid.getSortFor(col);

  public getSortIndexFor = (col: NgxColDef<T>): number | null =>
    this.grid.getSortIndexFor(col);

  public onRowClick = (row: T, rowIndex: number, event: MouseEvent): void =>
    this.grid.onRowClick(row, rowIndex, event);

  public isSelected = (row: T, rowIndex: number): boolean =>
    this.grid.isSelected(row, rowIndex);

  public setGlobalFilter = (text: string) =>
    this.grid.setGlobalFilter(text);

  public setColumnFilter = (filter: NgxColumnFilter<T>) =>
    this.grid.setColumnFilter(filter);

  public clearColumnFilter = (colId: string) =>
    this.grid.clearColumnFilter(colId);

  public clearAllFilters = () =>
    this.grid.clearAllFilters();

  public getCellRawValue = (row: T, col: NgxColDef<T>, rowIndex: number): T =>
    this.grid.getCellRawValue(row, col, rowIndex);

  public getCellFormattedValue = (row: T, col: NgxColDef<T>, rowIndex: number): string | number | null =>
    this.grid.getCellFormattedValue(row, col, rowIndex);

  public getCellRenderOutput = (row: T, col: NgxColDef<T>, rowIndex: number): string | number | null =>
    this.grid.getCellRenderOutput(row, col, rowIndex);

  public getCellClassList = (row: T, col: NgxColDef<T>, rowIndex: number): string[] =>
    this.grid.getCellClassList(row, col, rowIndex);

  public paginationTotal = (): number => this.grid.paginationTotal();
  public paginationPageIndex = (): number => this.grid.paginationPageIndex();
  public paginationTotalPages = (): number => this.grid.paginationTotalPages();
  public paginationPageSize = (): number => this.grid.paginationPageSize();
  public onPaginationSetPageSize = (size: number): void => this.grid.onPaginationSetPageSize(size);
  public onPaginationFirst = (): void => this.grid.onPaginationFirst();
  public onPaginationPrev = (): void => this.grid.onPaginationPrev();
  public onPaginationNext = (): void => this.grid.onPaginationNext();
  public onPaginationLast = (): void => this.grid.onPaginationLast();

  public trackRow: TrackByFunction<T> = (i, item) => this.grid.trackRow(i, item);

  protected readonly String = String;
  protected readonly Number = Number;
}
