import {
  AfterContentInit,
  Component,
  computed, ContentChildren,
  effect,
  input,
  output,
  QueryList,
  signal, TrackByFunction
} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {NgxColDef, NgxRowNode, NgxValueGetterParams} from './models/ngx-col-def.model';
import {NgxGridOptions} from './models/ngx-grid-options.model';
import {NgxRowSelection, NgxSortDirection} from './models/types';
import {NgxOnRowClickedEvent, NgxOnSelectionChangedEvent, NgxOnSortChangedEvent} from './models/events';
import {NgxCellTemplateDirective} from './directives/ngx-cell-template.directive';
import {NgxHeaderTemplateDirective} from './directives/ngx-header-template.directive';
import {NgxSortModelItem} from './models/ngx-sort.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {NgClass, NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'ngx-grid',
  imports: [
    NgTemplateOutlet,
    NgClass
  ],
  templateUrl: './ngx-grid.component.html',
  styleUrl: './ngx-grid.component.scss'
})
export class NgxGridComponent<T = any> implements AfterContentInit {
  public readonly rowData = input<T[]>([]);
  public readonly rowData$ = input<Observable<T[]> | null>(null);
  public readonly columnDefs = input<NgxColDef<T>[]>([]);
  public readonly defaultColDef = input<Partial<NgxColDef<T>> | null>(null);
  public readonly gridOptions = input<NgxGridOptions<T> | null>(null);
  public readonly rowSelection = input<NgxRowSelection>('none');



  public readonly rowClicked = output<NgxOnRowClickedEvent<T>>();
  public readonly selectionChanged = output<NgxOnSelectionChangedEvent<T>>();
  public readonly sortChanged = output<NgxOnSortChangedEvent<T>>();


  @ContentChildren(NgxCellTemplateDirective) cellTemplates!: QueryList<NgxCellTemplateDirective>;
  @ContentChildren(NgxHeaderTemplateDirective) headerTemplates!: QueryList<NgxHeaderTemplateDirective>;


  private _streamSub: Subscription | null = null;


  private _dataFromStream = signal<T[]>([]);
  // TODO: Verify this any type is appropriate or if it should be more specific
  private _selectedIds = signal<Set<any>>(new Set<any>());
  private _sortModel = signal<NgxSortModelItem[]>([]);
  public cellTemplateMap = signal(new Map<string, NgxCellTemplateDirective>());
  public headerTemplateMap = signal(new Map<string, NgxHeaderTemplateDirective>());



  public readonly data = computed<T[]>(() =>
    this.rowData$()
      ? (this._dataFromStream() ?? [])
      : (this.rowData() ?? [])
  );
  public readonly effectiveColDefs = computed<NgxColDef<T>[]>(() => {
    const colDefs = this.columnDefs() || [];
    const defaultColDefs = this.gridOptions()?.defaultColDef ?? this.defaultColDef() ?? {};
    return colDefs.map((colDef) => ({
      ...defaultColDefs,
      ...colDef,
      colId: colDef.colId ?? (colDef.field ? String(colDef.field) : '')
    }));
  });
  public readonly processedRows = computed<T[]>(() => {
    const rows = [...(this.data() ?? [])];
    const sorters = this._sortModel();
    if (sorters.length === 0) return rows;

    const cols = this.effectiveColDefs();
    const colMap = new Map(cols.map((col) => [col.colId!, col]));

    const getRowNode = (data: T, rowIndex: number): NgxRowNode<T> => ({
      id: this._getRowId(data, rowIndex),
      data,
      rowIndex,
      selected: this._selectedIds().has(this._getRowId(data, rowIndex)),
    });

    return rows.sort((a, b) => {
      for (const sort of sorters) {
        const col = colMap.get(sort.colId);
        if (!col) continue;

        const direction = sort.sort;
        const isInverted = direction === 'desc';
        const nodeA = getRowNode(a, -1);
        const nodeB = getRowNode(b, -1);

        const valueA = this.getCellRawValue(a, col, 0);
        const valueB = this.getCellRawValue(b, col, 0);

        let comparison: number;

        if (col.comparator) {
          comparison = col.comparator(valueA, valueB, nodeA, nodeB, isInverted);
        } else {
          comparison = this._defaultCompare(valueA, valueB);
        }

        if (comparison !== 0) return isInverted ? -comparison : comparison;
      }
      return 0;
    })
  });



  private _syncStream = effect((onCleanup) => {
    const src = this.rowData$();
    this._streamSub?.unsubscribe();
    this._streamSub = null;
    if (src) {
      this._streamSub = src.subscribe((rows) => this._dataFromStream.set(rows ?? []));
      onCleanup(() => this._streamSub?.unsubscribe());
    } else {
      this._dataFromStream.set([]);
    }
  });
  private _initSortModel = effect(() => {
    const cols = this.effectiveColDefs();
    const initial: NgxSortModelItem[] = cols
      .filter((col) => col.sort)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map((col, index) => ({
        colId: col.colId!,
        sort: col.sort as Exclude<NgxSortDirection, "none">,
        sortIndex: col.sortIndex ?? index,
      }));
    this._sortModel.set(initial);
  });
  private _emitSelection = effect(() => {
    const selected = this._getSelectedRows();
    this.selectionChanged.emit({ selected });
    this.gridOptions()?.onSelectionChanged?.({ selected });
  });
  private _emitSort = effect(() => {
    const sortModel = this._sortModel();
    this.sortChanged.emit({ sortModel });
    this.gridOptions()?.onSortChanged?.({ sortModel });
  });


  public readonly selectionChanged$: Observable<NgxOnSelectionChangedEvent> = toObservable(computed(() => ({
    selected: this._getSelectedRows(),
  })));
  public readonly sortChanged$: Observable<NgxSortModelItem[]> = toObservable(this._sortModel);



  ngAfterContentInit(): void {
    this._rebuildTemplateMaps();
    this.cellTemplates.changes.subscribe(() => this._rebuildTemplateMaps());
    this.headerTemplates.changes.subscribe(() => this._rebuildTemplateMaps());
  }

  private _rebuildTemplateMaps(): void {
    const cellMap = new Map<string, NgxCellTemplateDirective>();
    const headerMap = new Map<string, NgxHeaderTemplateDirective>();

    this.cellTemplates?.forEach((template) =>
      cellMap.set(template.colId(), template));
    this.headerTemplates?.forEach((template) =>
      headerMap.set(template.colId(), template));

    this.cellTemplateMap.set(cellMap);
    this.headerTemplateMap.set(headerMap);
  }

  public onHeaderClick(col: NgxColDef<T>, event: MouseEvent): void {
    if (col.sortable === false) return;

    const suppressMulti = this.gridOptions()?.suppressMultiSort ?? false;
    const multi = event.shiftKey && !suppressMulti;

    const colId = col.colId!;
    const current = [...this._sortModel()];
    const index = current.findIndex((sort) => sort.colId === colId);
    const nextDirection: NgxSortDirection = this._nextDirection(index >= 0 ? current[index].sort : 'none');

    if (!multi) {
      if (nextDirection === 'none') {
        this._sortModel.set([]);
      } else {
        this._sortModel.set([{ colId, sort: nextDirection, sortIndex: 0}]);
      }
      return;
    }

    if (nextDirection === 'none') {
      if (index >= 0) current.splice(index, 1);
    } else {
      if (index >= 0) {
        current[index] = { ...current[index], sort: nextDirection };
      } else {
        current.push({ colId, sort: nextDirection, sortIndex: current.length });
      }
      current.forEach((sort, index) => (sort.sortIndex = index));
    }

    this._sortModel.set(current);
  }

  public getSortFor(col: NgxColDef<T>): NgxSortDirection {
    const item = this._sortModel()
      .find((sort) => sort.colId === col.colId);
    return item ? item.sort : 'none';
  }

  public getSortIndexFor(col: NgxColDef<T>): number | null {
    const item = this._sortModel()
      .find((sort) => sort.colId === col.colId);
    return item && this._sortModel().length > 1 ? (item.sortIndex ?? null) : null;
  }

  public onRowClick(row: T, rowIndex: number, event: MouseEvent): void {
    this.rowClicked.emit({ data: row, rowIndex });
    this.gridOptions()?.onRowClicked?.({ data: row, rowIndex });

    const mode: NgxRowSelection = this._getSelectionMode();
    if (mode === 'none') return;

    const id = this._getRowId(row, rowIndex);
    this._selectedIds.update((set) => {
      const next = new Set(set);
      if (mode === 'single') {
        next.clear();
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      }
      return next;
    })
  }

  public isSelected(row: T, rowIndex: number): boolean {
    return this._selectedIds().has(this._getRowId(row, rowIndex));
  }

  private _getSelectionMode(): NgxRowSelection {
    return this.rowSelection() ?? this.gridOptions()?.rowSelection ?? 'none';
  }

  private _getRowId(data: T, index: number): string | number {
    const custom = this.gridOptions()?.getRowId;
    if (custom) {
      try {
        return custom({ data, index });
      } catch {
        // TODO: Handle error appropriately
      }
    }
    return (data as any)?.id ?? index;
  }

  private _nextDirection(current: NgxSortDirection): NgxSortDirection {
    switch (current) {
      case 'none':
        return 'asc';
      case 'asc':
        return 'desc';
      default:
        return 'none';
    }
  }

  private _defaultCompare(a: any, b: any): number {
    const an = a === null || a === undefined;
    const bn = b === null || b === undefined;
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;

    if (typeof a === 'number' && typeof b === 'number') return a - b;

    const da = this._tryToDate(a);
    const db = this._tryToDate(b);
    if (da && db) return da.getTime() - db.getTime();

    return String(a).localeCompare(String(b));
  }

  private _tryToDate(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  private _getSelectedRows(): T[] {
    const ids = this._selectedIds();
    const data = this.data();
    return data.filter((row, i) => ids.has(this._getRowId(row, i)));
  }

  public getCellRawValue(row: T, col: NgxColDef<T>, rowIndex: number): any {
    const baseValue = col.field
      ? this.getValueByPath(row, String(col.field))
      : undefined;
    if (col.valueGetter) {
      const params: NgxValueGetterParams<T> = {
        data: row,
        colDef: col,
        colId: col.colId!,
        value: baseValue,
        getValue: (path, data) => this.getValueByPath(data ?? row, path),
        rowIndex,
      }
      return col.valueGetter(params);
    }
    return baseValue;
  }

  public getCellFormattedValue(row: T, col: NgxColDef<T>, rowIndex: number): string | number | null {
    const raw = this.getCellRawValue(row, col, rowIndex);
    if (col.valueFormatter) {
      return col.valueFormatter({
        data: row,
        colDef: col,
        colId: col.colId!,
        value: raw,
        getValue: (path, data) => this.getValueByPath(data ?? row, path),
        rowIndex,
      });
    }
    return raw;
  }

  public getCellRenderOutput(row: T, col: NgxColDef<T>, rowIndex: number): string | number | null {
    if (!col.cellRenderer) return null;
    const formatted = this.getCellFormattedValue(row, col, rowIndex);
    return col.cellRenderer({
      data: row,
      colDef: col,
      colId: col.colId!,
      value: this.getCellRawValue(row, col, rowIndex),
      formattedValue: formatted,
      getValue: (path, data) => this.getValueByPath(data ?? row, path),
      rowIndex,
      selected: this.isSelected(row, rowIndex)
    });
  }

  public getCellClassList(row: T, col: NgxColDef<T>, rowIndex: number): string[] {
    const base: string[] = [];
    const add = (value: string | string[] | null | undefined) => {
      if (!value) return;
      if (Array.isArray(value)) base.push(...value);
      else base.push(value);
    };
    if (col.align) add(`nxg-align-${col.align}`);
    const formatted = this.getCellFormattedValue(row, col, rowIndex);
    const dynamic =
      typeof col.cellClass === 'function'
        ? col.cellClass({
          data: row,
          colDef: col,
          colId: col.colId!,
          value: this.getCellRawValue(row, col, rowIndex),
          formattedValue: formatted,
          getValue: (path, data) => this.getValueByPath(data ?? row, path),
          rowIndex,
          selected: this.isSelected(row, rowIndex),
        })
        : col.cellClass;
    add(dynamic);
    return base;
  }

  public getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((acc, key) =>
      (acc ? acc[key] : undefined), obj);
  }

  public trackRow: TrackByFunction<T> = (i, item) => {
    try {
      return this._getRowId(item, i) ?? i;
    } catch {
      return i;
    }
  }

  protected readonly String = String;
}
