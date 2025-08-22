import { Injectable } from '@angular/core';
import {NgxColDef, NgxValueGetterParams} from '../../models/ngx-col-def.model';
import {NgxGridSelectionService} from '../ngx-grid-selection/ngx-grid-selection.service';

@Injectable({
  providedIn: null
})
export class NgxGridValueService<T = any> {
  constructor(private readonly selection: NgxGridSelectionService<T>) {}

  public getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    if (!path.includes('.')) return obj[path];
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  }

  public getCellRawValue(row: T, col: NgxColDef<T>, rowIndex: number): any {
    const baseValue = col.field ? this.getValueByPath(row, String(col.field)) : undefined;
    if (col.valueGetter) {
      const params: NgxValueGetterParams<T> = {
        data: row,
        colDef: col,
        colId: col.colId!,
        value: baseValue,
        getValue: (path, data) => this.getValueByPath(data ?? row, path),
        rowIndex,
      };
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
      selected: this.selection.isSelected(row, rowIndex),
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
          selected: this.selection.isSelected(row, rowIndex),
        })
        : col.cellClass;
    add(dynamic);
    return base;
  }
}
