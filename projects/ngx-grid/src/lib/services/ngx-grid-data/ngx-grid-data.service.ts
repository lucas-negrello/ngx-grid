import {computed, effect, Injectable, Signal, signal} from '@angular/core';
import {Observable, Subscription} from 'rxjs';

@Injectable({
  providedIn: null
})
export class NgxGridDataService<T = any> {
  private _rowData = signal<T[]>([]);
  private _rowData$ = signal<Observable<T[]> | null>(null);
  private _dataFromStream = signal<T[]>([]);

  public readonly data = computed<T[]>(() =>
    this._rowData$() ? (this._dataFromStream() ?? []) : (this._rowData() ?? [])
  );

  private _streamSub: Subscription | null = null;

  public bind(rowData: Signal<T[]>, rowData$: Signal<Observable<T[]> | null>): void {
    effect((onCleanup) => {
      this._rowData.set(rowData() ?? []);
      this._rowData$.set(rowData$());

      this._streamSub?.unsubscribe();
      this._streamSub = null;
      const src = this._rowData$();
      if (src) {
        this._streamSub = src.subscribe((rows) => this._dataFromStream.set(rows ?? []));
        onCleanup(() => this._streamSub?.unsubscribe());
      } else {
        this._dataFromStream.set([]);
      }
    });
  }
}
