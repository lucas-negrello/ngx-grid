import {computed, effect, Injectable, Signal, signal, untracked} from '@angular/core';
import {NgxColDef} from '../../models/ngx-col-def.model';
import {NgxWidthPinState} from '../../models/ngx-grid-layout.model';
import {NgxPinnedSide} from '../../models/types';

@Injectable({
  providedIn: null
})
export class NgxGridLayoutService<T = any> {
  private readonly _colDefs = signal<NgxColDef<T>[]>([]);
  private readonly _state = signal<Map<string | number, NgxWidthPinState>>(new Map());

  private readonly DEFAULT_WIDTH = 150;
  private readonly DEFAULT_MIN = 60;
  private readonly DEFAULT_MAX = 320;

  public bind = (colDefs: Signal<NgxColDef<T>[]>) => {
    effect(() => {
      const defs = colDefs() ?? [];
      this._colDefs.set(defs);

      const prev = untracked(() => this._state());
      const current = new Map(prev);
      const ids = new Set<string | number>();

      for (const col of defs) {
        const id = col.colId;
        if (!id) continue;
        ids.add(id);
        if (!current.has(id)) {
          current.set(id, {
            width: col.width ?? null,
            pinned: col.pinned ?? null,
          });
        } else {
          const st = current.get(id)!;
          if (st.width === null && col.width !== null) st.width = col.width ?? null;
          if (st.pinned === null && col.pinned !== null) st.pinned = col.pinned ?? null;
        }
      }

      [...current.keys()].forEach((id) => {
        if (!ids.has(id)) current.delete(id);
      });
      if (!this._mapEquals(prev, current))
        this._state.set(current);
    });
  };

  public getColumnWidth =
    (colId: string | number): number => {
      const st = this._state().get(colId);
      if (st && st?.width !== null) return this._clampWidth(colId, st.width);
      const def = this._find(colId);
      const w = def?.width ?? this.DEFAULT_WIDTH;
      return this._clampWidth(colId, w);
    };

  public getColumnMinWidth =
    (colId: string | number): number => {
      const def = this._find(colId);
      return Math.max(1, Math.floor(def?.minWidth ?? this.DEFAULT_MIN));
    };

  public getColumnMaxWidth =
    (colId: string | number): number => {
      const def = this._find(colId);
      return Math.max(this.getColumnMinWidth(colId), Math.floor(def?.maxWidth ?? this.DEFAULT_MAX));
    };

  public setColumnWidth =
    (colId: string | number, width: number) => {
      const st = this._ensureState(colId);
      const clamped = this._clampWidth(colId, width);
      if (st.width === clamped) return;
      const next = new Map(this._state());
      next.set(colId, { ...st, width: clamped });
      this._state.set(next);
    };

  public pinColumn =
    (colId: string | number, side: NgxPinnedSide) => {
      const st = this._ensureState(colId);
      if (st.pinned === side) return;
      const next = new Map(this._state());
      next.set(colId, { ...st, pinned: side });
      this._state.set(next);
    };

  public getPinnedSide =
    (colId: string | number): NgxPinnedSide | null =>
      this._state().get(colId)?.pinned ?? null;

  public isPinnedStart =
    (colId: string | number): boolean =>
      this.getPinnedSide(colId) === 'start';

  public isPinnedEnd =
    (colId: string | number): boolean =>
      this.getPinnedSide(colId) === 'end';

  private readonly _order = computed<(string | number)[]>(() => (
    (this._colDefs() ?? []).map(c => c.colId as (string | number))
  ));

  private readonly _pinnedStartOrder = computed<(string | number)[]>(() => (
    this._order().filter(id => this.isPinnedStart(id))
  ));

  private readonly _pinnedEndOrder = computed<(string | number)[]>(() => (
    this._order().filter(id => this.isPinnedEnd(id))
  ));

  public readonly pinnedOffsetsLeft = computed<Map<string | number, number>>(() => {
    const map = new Map<string | number, number>();
    let acc = 0;
    for (const id of this._pinnedStartOrder()) {
      map.set(id, acc);
      acc += this.getColumnWidth(id);
    }
    return map;
  });

  public readonly pinnedOffsetsRight = computed<Map<string | number, number>>(() => {
    const map = new Map<string | number, number>();
    let acc = 0;
    for (const id of this._pinnedEndOrder().slice().reverse()) {
      map.set(id, acc);
      acc += this.getColumnWidth(id);
    }
    return map;
  });

  public readonly getPinnedOffset =
    (colId: string | number): number => {
      if (this.isPinnedStart(colId)) return this.pinnedOffsetsLeft().get(colId) ?? 0;
      if (this.isPinnedEnd(colId)) return this.pinnedOffsetsRight().get(colId) ?? 0;
      return 0;
    };

  private _find = (colId: string | number): NgxColDef<T> | undefined =>
    (this._colDefs() ?? []).find(c => c.colId === colId);

  private _ensureState = (colId: string | number): NgxWidthPinState => {
    const st = this._state().get(colId);
    if (st) return st;
    const next = new Map(this._state());
    const def = this._find(colId);
    const initial: NgxWidthPinState = {
      width: def?.width ?? null,
      pinned: def?.pinned ?? null,
    };
    next.set(colId, initial);
    this._state.set(next);
    return initial;
  };

  private _clampWidth = (colId: string | number, width: number): number => {
    const min = this.getColumnMinWidth(colId);
    const max = this.getColumnMaxWidth(colId);
    return Math.min(Math.max(Math.floor(width), min), max);
  }

  private _mapEquals =
    (
      a: Map<string | number, NgxWidthPinState>,
      b: Map<string | number, NgxWidthPinState>
    ): boolean => {
      if (a === b) return true;
      if (a.size !== b.size) return false;
      for (const [key, av] of a) {
        const bv = b.get(key);
        if (!bv) return false;
        if (av.width !== bv.width || av.pinned !== bv.pinned) return false;
      }
      return true;
    }

}
