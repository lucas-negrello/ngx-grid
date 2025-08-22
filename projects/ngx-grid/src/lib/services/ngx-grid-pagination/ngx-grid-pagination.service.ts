import {computed, effect, Injectable, Signal, signal} from '@angular/core';

@Injectable({
  providedIn: null
})
export class NgxGridPaginationService<T = any> {
  private _data = signal<T[]>([]);
  private _pageIndex = signal(0);
  private _pageSize = signal<number>(50);

  public readonly pageIndex = computed(() => this._pageIndex());
  public readonly pageSize = computed(() => this._pageSize());
  public readonly total = computed(() => this._data().length);
  public readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this._pageSize())))
  );

  public bind(data: Signal<T[]>, defaultPageSize = 50): void {
    effect(() => {
      this._data.set(data() ?? []);
      if (defaultPageSize > 0) this._pageSize.set(defaultPageSize);

      const max = Math.max(0, this.totalPages() - 1);
      if (this._pageIndex() > max) this._pageIndex.set(max);
    });
  }

  public apply(rows: T[]): T[] {
    const size = Math.max(1, this._pageSize());
    const start = this._pageIndex() * size;
    return rows.slice(start, start + size);
  }

  public setPageSize(size: number): void {
    const safe = Math.max(1, Math.floor(size));
    this._pageSize.set(safe);
    this._pageIndex.set(0);
  }

  public setPageIndex(index: number): void {
    const max = Math.max(0, this.totalPages() - 1);
    const clamped = Math.min(Math.max(0, Math.floor(index)), max);
    this._pageIndex.set(clamped);
  }

  public next(): void {
    this.setPageIndex(this._pageIndex() + 1);
  }
  public prev(): void {
    this.setPageIndex(this._pageIndex() - 1);
  }
}
