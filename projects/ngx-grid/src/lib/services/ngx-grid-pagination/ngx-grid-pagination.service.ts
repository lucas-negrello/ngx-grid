import {computed, effect, Injectable, Signal, signal} from '@angular/core';
import {NgxPaginationMode} from '../../models/types';
import {
  NgxPageRefreshOptions,
  NgxPageRequest,
  NgxPageResult,
  NgxServerFetcher
} from '../../models/ngx-pagination.model';
import {catchError, Observable, of, Subscription} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {NgxGridSortService} from '../ngx-grid-sort/ngx-grid-sort.service';
import {NgxBaseEvent, NgxOnPageChangesEvent} from '../../models/events';
import {NgxGridApi} from '../../api/ngx-grid-api';

@Injectable({
  providedIn: null
})
export class NgxGridPaginationService<T = any> {
  // Data Source
  private readonly _data = signal<T[]>([]);

  // Pagination State
  private readonly _mode = signal<NgxPaginationMode>('client');
  private readonly _pageIndex = signal(0);
  private readonly _pageSize = signal<number>(25);

  // Server Side
  private readonly _serverFetcher = signal<NgxServerFetcher<T> | null>(null);
  private readonly _serverRows = signal<T[]>([]);
  private _sub: Subscription | null = null;

  // Derivated State / Extra
  private readonly _totalOverride = signal<number | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<unknown | null>(null);

  public readonly mode = computed(() => this._mode());
  public readonly pageIndex = computed(() => this._pageIndex());
  public readonly pageSize = computed(() => this._pageSize());
  public readonly total = computed(() =>
    this._mode() === 'server'
      ? (this._totalOverride() ?? 0)
      : (this._data()?.length ?? 0)
  );
  public readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this._pageSize())))
  );
  public readonly loading = computed(() => this._loading());
  public readonly error = computed(() => this._error());

  public readonly pageChanges$ = toObservable(
    computed<NgxOnPageChangesEvent<T>>(() => ({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      total: this.total(),
      pageCount: this.totalPages()
    }))
  );

  public setPageChanges$ =
    (api: NgxGridApi<T>): Observable<NgxBaseEvent<T, NgxOnPageChangesEvent<T>>> =>
      toObservable(computed(() => ({
        api,
        event: {
          pageIndex: this.pageIndex(),
          pageSize: this.pageSize(),
          total: this.total(),
          pageCount: this.totalPages()
        }
      })));

  private _serverSideEffect = () => effect((onCleanup) => {
    if (this._mode() !== 'server') return;
    const fetcher = this._serverFetcher();
    if (!fetcher) return;

    const req: NgxPageRequest = {
      pageIndex: this._pageIndex(),
      pageSize: this._pageSize(),
      sortModel: this._sortService.sortModel(),
    };

    this._sub?.unsubscribe();
    this._loading.set(true);
    this._error.set(null);

    this._sub = fetcher(req)
      .pipe(
        catchError((err) => {
          this._error.set(err);
          return of<NgxPageResult<T>>({ rows: [], total: 0 });
        }),
      )
      .subscribe((res) => {
        this._serverRows.set(res.rows ?? []);
        this._totalOverride.set(res.total ?? 0);
        this._loading.set(false);
      });

    onCleanup(() => this._sub?.unsubscribe());
  });
  private _clientSideEffect = () => effect(() => {
    if (this._mode() !== 'client') return;
    this._totalOverride.set(null);
    const max = Math.max(0, this.totalPages() - 1);
    if (this._pageIndex() > max) this._pageIndex.set(max);
  })

  constructor(
    private readonly _sortService: NgxGridSortService<T>,
  ) {
    this._serverSideEffect();
    this._clientSideEffect();
  }

  public bind =
    (data: Signal<T[]>, defaultPageSize = 25): void => {
      const safeDefault = Math.max(1, Math.floor(defaultPageSize));
      this._pageSize.set(safeDefault);
      effect(() => {
        this._data.set(data() ?? []);

        const max = Math.max(0, this.totalPages() - 1);
        if (this._pageIndex() > max) this._pageIndex.set(max);
      });
    }

  public apply =
    (rows: T[]): T[] => {
      if (this._mode() === 'server') return this._serverRows();

      const size = Math.max(1, this._pageSize());
      const start = this._pageIndex() * size;
      return rows.slice(start, start + size);
    }

  public setMode =
    (mode: NgxPaginationMode): void => {
        this._mode.set(mode);
        if (mode === 'client') {
          this._loading.set(false);
          this._error.set(null);
          this._totalOverride.set(null);
        }
      }

  public setServerFetcher =
    (fetcher: NgxServerFetcher<T> | null) =>
      this._serverFetcher.set(fetcher);

  public setPageSize =
    (size: number): void => {
      const safe = Math.max(1, Math.floor(size));
      this._pageSize.set(safe);
      this._pageIndex.set(0);
    }

  public setPageIndex =
    (index: number): void => {
      const max = Math.max(0, this.totalPages() - 1);
      const clamped = Math.min(Math.max(0, Math.floor(index)), max);
      this._pageIndex.set(clamped);
    }

  public next = (): void =>
    this.setPageIndex(this._pageIndex() + 1);

  public prev = (): void =>
    this.setPageIndex(this._pageIndex() - 1);

  public first = (): void =>
    this.setPageIndex(0);

  public last = (): void =>
    this.setPageIndex(this.totalPages() - 1);

  public refresh =
    (opts?: NgxPageRefreshOptions)=> {
      if (!opts?.keepPage) this.first();
      else this.setPageIndex(this._pageIndex());
    }
}
