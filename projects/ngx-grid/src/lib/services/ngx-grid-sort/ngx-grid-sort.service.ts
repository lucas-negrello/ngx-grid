import {computed, effect, Injectable, Signal, signal} from '@angular/core';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxSortModelItem} from '../../models/ngx-sort.model';
import {NgxGridColumnService} from '../ngx-grid-column/ngx-grid-column.service';
import {NgxGridValueService} from '../ngx-grid-value/ngx-grid-value.service';
import {NgxSortDirection} from '../../models/types';
import {NgxColDef, NgxRowNode} from '../../models/ngx-col-def.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';
import {NgxOnSortChangedEvent} from '../../models/events';

@Injectable({
  providedIn: null
})
export class NgxGridSortService<T = any> {
  private _gridOptions = signal<NgxGridOptions<T> | null>(null);
  private _sortModel = signal<NgxSortModelItem[]>([]);

  public readonly sortModel = computed(() => this._sortModel());
  public readonly sortChanged$: Observable<NgxOnSortChangedEvent<T>> = toObservable(computed(() => ({
    sortModel: this.sortModel(),
  })));

  constructor(
    private readonly columns: NgxGridColumnService<T>,
    private readonly value: NgxGridValueService<T>,
  ) {
    effect(() => {
      const cols = this.columns.effectiveColDefs();
      const initial: NgxSortModelItem[] = cols
        .filter((col) => col.sort)
        .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
        .map((col, index) => ({
          colId: col.colId!,
          sort: col.sort as Exclude<NgxSortDirection, 'none'>,
          sortIndex: col.sortIndex ?? index,
        }));
      this._sortModel.set(initial);
    });
  }

  public bind(gridOptions: Signal<NgxGridOptions<T> | null>): void {
    effect(() => this._gridOptions.set(gridOptions()));
  }

  public sortRows(rows: T[]): T[] {
    const sorters = this._sortModel();
    if (sorters.length === 0) return rows.slice();

    const cols = this.columns.effectiveColDefs();
    const colMap = new Map(cols.map((col) => [col.colId!, col]));
    const getRowNode = (data: T, rowIndex: number): NgxRowNode<T> => ({
      id: rowIndex,
      data,
      rowIndex,
      selected: false,
    });

    return rows.slice().sort((a, b) => {
      for (const sort of sorters) {
        const col = colMap.get(sort.colId);
        if (!col) continue;

        const direction = sort.sort;
        const isInverted = direction === 'desc';
        const nodeA = getRowNode(a, -1);
        const nodeB = getRowNode(b, -1);

        const valueA = this.value.getCellRawValue(a, col, 0);
        const valueB = this.value.getCellRawValue(b, col, 0);

        let comparison: number;
        if (col.comparator) comparison = col.comparator(valueA, valueB, nodeA, nodeB, isInverted);
        else comparison = this._defaultCompare(valueA, valueB);

        if (comparison !== 0) return isInverted ? -comparison : comparison;
      }
      return 0;
    });
  }

  public onHeaderClick(col: NgxColDef<T>, event: MouseEvent): void {
    if (col.sortable === false) return;

    const suppressMulti = this._gridOptions()?.suppressMultiSort ?? false;
    const multi = event.shiftKey && !suppressMulti;

    const colId = col.colId!;
    const current = [...this._sortModel()];
    const index = current.findIndex((s) => s.colId === colId);
    const nextDirection: NgxSortDirection = this._nextDirection(index >= 0 ? current[index].sort : 'none');

    if (!multi) {
      if (nextDirection === 'none') this._sortModel.set([]);
      else this._sortModel.set([{ colId, sort: nextDirection, sortIndex: 0 }]);
      return;
    }

    if (nextDirection === 'none') {
      if (index >= 0) current.splice(index, 1);
    } else {
      if (index >= 0) current[index] = { ...current[index], sort: nextDirection };
      else current.push({ colId, sort: nextDirection, sortIndex: current.length });
      current.forEach((s, i) => (s.sortIndex = i));
    }
    this._sortModel.set(current);
  }

  public getSortFor(col: NgxColDef<T>): NgxSortDirection {
    const item = this._sortModel().find((s) => s.colId === col.colId);
    return item ? item.sort : 'none';
  }

  public getSortIndexFor(col: NgxColDef<T>): number | null {
    const item = this._sortModel().find((s) => s.colId === col.colId);
    return item && this._sortModel().length > 1 ? (item.sortIndex ?? null) : null;
  }

  public setSortModel(model: NgxSortModelItem[]): void {
    this._sortModel.set(model.map((m, i) => ({ ...m, sortIndex: i })));
  }

  public clearSort(): void {
    this._sortModel.set([]);
  }

  private _nextDirection(current: NgxSortDirection): NgxSortDirection {
    switch (current) {
      case 'none': return 'asc';
      case 'asc': return 'desc';
      default: return 'none';
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

}
