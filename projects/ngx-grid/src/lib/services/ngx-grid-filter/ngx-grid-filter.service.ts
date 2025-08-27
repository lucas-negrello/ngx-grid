import {computed, effect, Injectable, signal, Signal} from '@angular/core';
import {NgxColDef} from '../../models/ngx-col-def.model';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxGridValueService} from '../ngx-grid-value/ngx-grid-value.service';
import {NgxColumnFilter, NgxFilterModel} from '../../models/ngx-filter.model';
import {Observable, of} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {NgxFilterOperator} from '../../models/types';

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
            if (typeof col.filterPredicate === 'function') {
              if (!col.filterPredicate(cellVal, filter)) return false;
            }
            else if (!this._matchOperator(cellVal, filter)) return false;
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
        const path = col.field ?? '';
        if (!path) return undefined;
        return this._get(row, path);
      }
    };

  private _get = (obj: any, path: string): any => {
    try {
      return path.split('.').reduce((acc, key) =>
        (acc == null ? undefined : acc[key]), obj);
    } catch {
      return undefined;
    }
  }

  private _matchOperator = (value: any, filter: NgxColumnFilter<T>): boolean => {
    const op: NgxFilterOperator = filter?.operator ?? 'contains';
    const caseSensitive = !!filter?.caseSensitive;

    if (op === 'isEmpty') {
      if (value == null) return true;
      if (typeof value === 'string') return value.length === 0;
      if (Array.isArray(value)) return value.length === 0;
      return String(value).length === 0;
    }
    if (op === 'isNotEmpty') {
      if (value == null) return false;
      if (typeof value === 'string') return value.length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return String(value).length > 0;
    }

    const v = value as any;
    const f = filter?.value as any;

    const toStr = (x: any) => (x == null ? '' : String(x));
    const toCmpStr = (x: any) => (caseSensitive ? toStr(x) : toStr(x).toLowerCase());

    const isNumber = (x: any) => typeof x === 'number' || (x !== null && x !== '' && !isNaN(x));
    const toNum = (x: any) => (typeof x === 'number' ? x : parseFloat(x));
    const isDate = (x: any) => x instanceof Date || (!isNaN(Date.parse(x)));
    const toDate = (x: any) => (x instanceof Date ? x : new Date(x));

    if (['gt', 'gte', 'lt', 'lte'].includes(op)) {
      if (isNumber(v) && isNumber(f)) {
        const a = toNum(v);
        const b = toNum(f);
        if (op === 'gt') return a > b;
        if (op === 'gte') return a >= b;
        if (op === 'lt') return a < b;
        if (op === 'lte') return a <= b;
      }
      if (isDate(v) && isDate(f)) {
        const a = toDate(v).getTime();
        const b = toDate(f).getTime();
        if (op === 'gt') return a > b;
        if (op === 'gte') return a >= b;
        if (op === 'lt') return a < b;
        if (op === 'lte') return a <= b;
      }
      return false;
    }

    const sv = toCmpStr(v);
    const sf = toCmpStr(f);

    switch (op) {
      case 'contains':
        return sv.includes(sf);
      case 'equals':
        if (isNumber(v) && isNumber(f)) return toNum(v) === toNum(f);
        if (isDate(v) && isDate(f)) return toDate(v).getTime() === toDate(f).getTime();
        return sv === sf;
      case 'startsWith':
        return sv.startsWith(sf);
      case 'endsWith':
        return sv.endsWith(sf);
      default:
        // fallback
        return sv.includes(sf);
    }
  };
}
