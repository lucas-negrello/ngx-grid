import {computed, effect, Injectable, signal, Signal} from '@angular/core';
import {NgxColDef} from '../../models/ngx-col-def.model';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxGridValueService} from '../ngx-grid-value/ngx-grid-value.service';
import {NgxColumnFilter, NgxFilterModel} from '../../models/ngx-filter.model';
import {Observable, of} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: null
})
export class NgxGridFilterService<T = any> {
  private _colDefs!: Signal<NgxColDef<T>[]>;
  private _gridOptions!: Signal<NgxGridOptions<T> | null>;
  private _valueService!: NgxGridValueService<T>;

  private readonly _globalText = signal<string>('');
  private readonly _columnFilters = signal<Map<string | number, NgxColumnFilter<T>>>(new Map());

  private readonly _filterModel = computed<NgxFilterModel<T>>(() => ({
    globalText: this._globalText(),
    columnFilters: this.getColumnFilters(),
  }));

  public readonly filterChanges$: Observable<NgxFilterModel<T>> = toObservable(this._filterModel);

  private readonly _colDefMap = computed(() => {
    const map = new Map<string | number, NgxColDef<T>>();
    for (const colDef of this._colDefs()) {
      const id = colDef.colId ?? colDef.field ?? '';
      if (id) map.set(id, colDef);
    }
    return map;
  });


  public bind = (
    colDefs: Signal<NgxColDef<T>[]>,
    gridOptions: Signal<NgxGridOptions<T> | null>,
    valueService: NgxGridValueService<T>,
    externalGlobalText?: Signal<string>,
    externalColumnFilters?: Signal<NgxColumnFilter<T>[] | Record<string, any> | null>
  ): void => {
    this._colDefs = colDefs;
    this._gridOptions = gridOptions;
    this._valueService = valueService;

    if (externalGlobalText) {
      effect(() => this.setGlobalText(externalGlobalText() ?? ''));
    }

    if (externalColumnFilters) {
      effect(() => {
        const ext = externalColumnFilters();
        if (!ext) {
          this._columnFilters.set(new Map());
          return;
        }
        const arr = Array.isArray(ext)
          ? (ext as NgxColumnFilter<T>[])
          : this._normalizeRecordToArray(ext as Record<string, any>);
        const map = new Map<string | number, NgxColumnFilter<T>>();
        for (const filter of arr) {
          if (filter?.colId) map.set(filter.colId, filter);
        }
        this._columnFilters.set(map);
      });
    }
  }

  public setGlobalText =
    (text: string) =>
      this._globalText.set((text ?? '').toString());

  public getGlobalText =
    (): string =>
      this._globalText();

  public setColumnFilter =
    (filter: NgxColumnFilter<T>) => {
      if (!filter?.colId) return;
      const map = new Map(this._columnFilters());
      map.set(filter.colId, filter);
      this._columnFilters.set(map);
    };

  public clearColumnFilter =
    (colId: string | number) => {
      const map = new Map(this._columnFilters());
      map.delete(colId);
      this._columnFilters.set(map);
    };

  public clearAll = () => {
    this._globalText.set('');
    this._columnFilters.set(new Map());
  };

  public getFilterModel =
    (): NgxFilterModel<T> =>
      this._filterModel();

  public getColumnFilters =
    () =>
      Array.from(this._columnFilters().values());

  public getColumnFilter =
    (colId: string | number): NgxColumnFilter<T> | undefined =>
      this._columnFilters().get(colId);

  public apply =
    (rows: T[]): T[] => {
      if (!Array.isArray(rows) || rows.length === 0) return rows;

      const globalText = (this._globalText() ?? '').trim();
      const filters = this._columnFilters();

      const hasGlobal = globalText.length > 0;
      const hasColumns = filters.size > 0;

      if (!hasGlobal && !hasColumns) return rows;

      const colDefs = this._colDefs();
      const filterableCols = colDefs;

      return rows.filter((row, index) => {
        if (hasColumns) {
          for (const [colId, filter] of filters) {
            const col = this._resolveColDef(colId);
            if (!col) continue;
            const cellVal = this._getCellRawValue(row, col, index);
            if (!this._matchOperator(cellVal, filter)) return false;
          }
        }

        if (hasGlobal) {
          const global = globalText.toLowerCase();

          const custom = this._gridOptions()?.globalFilterPredicate;

          if (typeof custom === 'function') {
            if (!custom(row, globalText)) return false;
          } else {
            let hit = false;
            for (const col of filterableCols) {
              const val = this._getCellRawValue(row, col, index);
              const s = val == null ? '' : String(val);
              if (s.toLowerCase().includes(global)) {
                hit = true;
                break;
              }
            }
            if (!hit) return false;
          }
        }

        return true;
      });
    };

  private _normalizeRecordToArray =
    (record: Record<string, any>): NgxColumnFilter<T>[] => {
      const arr: NgxColumnFilter<T>[] = [];
      for (const [colId, value] of Object.entries(record)) {
        if (value && typeof value === 'object' && 'operator' in value) {
          arr.push({ colId, ...value });
        } else {
          arr.push({ colId, operator: 'contains', value })
        }
      }
      return arr;
    };

  private _resolveColDef =
    (colId: string | number) => {
      const map = this._colDefMap();
      if (map.has(colId)) return map.get(colId);
      for (const col of this._colDefs()) {
        const id = col.colId ?? col.field;
        if (id === colId) return col;
      }
      return undefined;
    };

  private _getCellRawValue =
    (row: T, col: NgxColDef<T>, index: number) => {
      try {
        return this._valueService.getCellRawValue(row, col, index);
      } catch {
        const field = (col as any).field;
        return field ? (row as any)?.[field] : (row as any);
      }
    };

  private _matchOperator =
    (value: any, filter: NgxColumnFilter<T>): boolean => {
      const operator = filter.operator;
      const caseSensitive = !!filter.caseSensitive;

      const col = this._resolveColDef(filter.colId);
      if (col?.filterPredicate && typeof col.filterPredicate === 'function') {
        try {
          return col.filterPredicate(value, filter);
        } catch {

        }
      }

      const isNil = (value: any) => value === null || value === undefined;
      const toStr = (value: any) => (isNil(value) ? '' : String(value));
      const sVal = toStr(value);
      const sFilter = toStr(filter.value);

      switch (operator) {
        case 'contains':
          return caseSensitive
            ? sVal.includes(sFilter)
            : sVal.toLowerCase().includes(sFilter.toLowerCase());
        case 'equals':
          return caseSensitive
            ? sVal === sFilter
            : sVal.toLowerCase() === sFilter.toLowerCase();
        case 'startsWith':
          return caseSensitive
            ? sVal.startsWith(sFilter)
            : sVal.toLowerCase().startsWith(sFilter.toLowerCase());
        case 'endsWith':
          return caseSensitive
            ? sVal.endsWith(sFilter)
            : sVal.toLowerCase().endsWith(sFilter.toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        case 'in': {
          const set = new Set(Array.isArray(filter.value) ? filter.value : [filter.value]);
          return set.has(value);
        }
        case 'notIn': {
          const set = new Set(Array.isArray(filter.value) ? filter.value : [filter.value]);
          return !set.has(value);
        }
        case 'isEmpty':
          return isNil(value) || (typeof value === 'string' && value.trim() === '');
        case 'isNotEmpty':
          return !isNil(value) && (typeof value !== 'string' || value.trim() !== '');
        default:
          return true;
      }
    };
}
