import {computed, effect, Injectable, Signal, signal} from '@angular/core';
import {NgxColDef} from '../../models/ngx-col-def.model';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';

@Injectable({
  providedIn: null
})
export class NgxGridColumnService<T = any> {
  private _columnDefs = signal<NgxColDef<T>[]>([]);
  private _defaultColDef = signal<Partial<NgxColDef<T>> | null>(null);
  private _gridOptions = signal<NgxGridOptions<T> | null>(null);

  public readonly effectiveColDefs = computed<NgxColDef<T>[]>(() => {
    const colDefs = this._columnDefs() || [];
    const defaultColDefs = this._gridOptions()?.defaultColDef ?? this._defaultColDef() ?? {};
    return colDefs.map((colDef) => ({
      ...defaultColDefs,
      ...colDef,
      colId: colDef.colId ?? (colDef.field ? String(colDef.field) : '')
    }));
  });

  public bind(
    columnDefs: Signal<NgxColDef<T>[]>,
    defaultColDef: Signal<Partial<NgxColDef<T>> | null>,
    gridOptions: Signal<NgxGridOptions<T> | null>,
  ): void {
    effect(() => {
      this._columnDefs.set(columnDefs() ?? []);
      this._defaultColDef.set(defaultColDef());
      this._gridOptions.set(gridOptions());
    });
  }

}
