import {computed, effect, Injectable, Signal, signal} from '@angular/core';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxRowSelection} from '../../models/types';
import {toObservable} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';
import {NgxOnSelectionChangedEvent} from '../../models/events';

@Injectable({
  providedIn: null
})
export class NgxGridSelectionService<T = any> {
  private _gridOptions = signal<NgxGridOptions<T> | null>(null);
  private _rowSelection = signal<NgxRowSelection>('none');
  private _selectedIds = signal<Set<any>>(new Set<any>());
  private _data = signal<T[]>([]);

  public readonly selectionChanged = computed<T[]>(() => this.getSelectedRows());
  public readonly selectionChanged$: Observable<NgxOnSelectionChangedEvent<T>> = toObservable(computed(() => ({
    selected: this.selectionChanged(),
  })));

  public bind(
    gridOptions: Signal<NgxGridOptions<T> | null>,
    rowSelection: Signal<NgxRowSelection>,
    data: Signal<T[]>,
  ): void {
    effect(() => {
      this._gridOptions.set(gridOptions());
      this._rowSelection.set(rowSelection() ?? (gridOptions()?.rowSelection ?? 'none'));
      this._data.set(data() ?? []);
    });
  }

  public onRowClick(row: T, rowIndex: number): void {
    const mode = this._rowSelection() ?? this._gridOptions()?.rowSelection ?? 'none';
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
    });
  }

  public isSelected(row: T, rowIndex: number): boolean {
    return this._selectedIds().has(this._getRowId(row, rowIndex));
  }

  public clearSelection(): void {
    this._selectedIds.set(new Set<any>());
  }

  public getSelectedRows(): T[] {
    const ids = this._selectedIds();
    const data = this._data();
    return data.filter((row, i) => ids.has(this._getRowId(row, i)));
  }

  private _getRowId(data: T, index: number): string | number {
    const custom = this._gridOptions()?.getRowId;
    if (custom) {
      try { return custom({ data, index }); } catch { /* ignore */ }
    }
    return (data as any)?.id ?? index;
  }
}
