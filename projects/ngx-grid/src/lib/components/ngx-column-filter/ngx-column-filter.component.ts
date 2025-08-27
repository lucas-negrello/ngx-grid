import {Component, computed, HostListener, inject, input, signal} from '@angular/core';
import {NgxColDef, NgxColumnFilterOptions} from '../../models/ngx-col-def.model';
import {NgxGridService} from '../../ngx-grid.service';
import {NgxGridFilterService} from '../../services/ngx-grid-filter/ngx-grid-filter.service';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxFilterOperator} from '../../models/types';
import {NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'ngx-column-filter',
  imports: [
    NgStyle,
    FormsModule
  ],
  templateUrl: './ngx-column-filter.component.html',
  styleUrl: './ngx-column-filter.component.scss'
})
export class NgxColumnFilterComponent<T = any> {
  public col = input.required<NgxColDef<T>>();

  private readonly _grid = inject(NgxGridService<T>);
  private readonly _filter = inject(NgxGridFilterService<T>);

  public readonly open = signal(false);
  public readonly colId = computed(() => this.col().colId ?? this.col().field ?? '');
  public readonly gridOptions = computed<NgxGridOptions<T> | null>(() => this._grid['__inputs']?.gridOptions?.() ?? null);
  public readonly enabled = computed<boolean>(() => {
    const global = this.gridOptions()?.enableColumnFilter ?? true;
    if (!global) return false;
    if (typeof this.col()?.filter === 'boolean') return this.col()?.filter as boolean;
    return (this.col().filter as NgxColumnFilterOptions<T> | undefined)?.enabled ?? true;
  });
  public readonly options = computed<Required<Omit<NgxColumnFilterOptions<T>, 'operators'>> & { operators: NgxFilterOperator[] }>(() => {
    const defaults = (this.gridOptions()?.columnFilterDefaults ?? {}) as NgxColumnFilterOptions<T>;
    const colOptions = typeof this.col()?.filter === 'object' ? (this.col().filter as NgxColumnFilterOptions<T>) : {};
    const enabled = typeof this.col()?.filter === 'boolean' ? (this.col().filter as boolean) : (colOptions.enabled ?? true);
    const showPopup = colOptions.showPopup ?? defaults.showPopup ?? true;
    const placeholder = colOptions.placeholder ?? defaults.placeholder ?? 'Filter...';
    const caseSensitive = colOptions.caseSensitive ?? defaults.caseSensitive ?? false;
    const operators = colOptions.operators ?? defaults.operators ?? this._defaultOperators();
    return { enabled, showPopup, placeholder, caseSensitive, operators };
  });
  public readonly current = computed(() => {
    const id = this.colId();
    return id ? this._filter.getColumnFilter(id) : undefined;
  });
  public readonly operator = signal<NgxFilterOperator>('contains');
  public readonly value = signal<any>('');
  public readonly caseSensitive = signal<boolean>(false);

  private readonly _popupLeft = signal<string>('0px');
  private readonly _popupTop = signal<string>('0px');

  public toggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (!this.enabled() || !this.options().showPopup) return;
    const c = this.current();
    this.operator.set(c?.operator ?? this.operator());
    this.value.set(c?.value ?? '');
    this.caseSensitive.set(c?.caseSensitive ?? this.options().caseSensitive);
    this.open.update(v => !v);
    setTimeout(() => {
      this._repositionPopup(e);
    });
  };

  public apply = () => {
    const colId = this.colId();
    if (!colId) return;
    this._grid.setColumnFilter({
      colId,
      operator: this.operator(),
      value: this.value(),
      caseSensitive: this.caseSensitive()
    });
    this.open.set(false);
  };

  public clear = () => {
    const colId = this.colId();
    if (!colId) return;
    this._grid.clearColumnFilter(colId);
    this.value.set('');
    this.open.set(false);
  };

  public onInlineChange = (value: string) => {
    const colId = this.colId();
    if (!colId) return;
    this._grid.setColumnFilter({
      colId,
      operator: 'contains',
      value,
      caseSensitive: this.options().caseSensitive,
    });
  }

  private _defaultOperators = (): NgxFilterOperator[] => [
    'contains', 'equals', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'
  ];

  public getPopupLeft = (): string => this._popupLeft();
  public getPopupTop = (): string => this._popupTop();

  private _repositionPopup(e: MouseEvent) {
    const anchor = (e.currentTarget as HTMLElement) || (e.target as HTMLElement);
    const anchorEl = anchor?.closest('.nxg-column-filter') as HTMLElement || anchor as HTMLElement;
    const popupEl = anchorEl?.querySelector('.nxg-filter__popup') as HTMLElement;
    const rect = (anchorEl || anchor)?.getBoundingClientRect();

    const fallbackWidth = 280;
    const fallbackHeight = 220;

    const popupRect = popupEl?.getBoundingClientRect();
    const popupW = popupRect?.width || fallbackWidth;
    const popupH = popupRect?.height || fallbackHeight;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = rect ? rect.left : e.clientX;
    let top = rect ? rect.bottom : e.clientY;

    if (left + popupW > viewportW - 8) {
      left = Math.max(8, viewportW - popupW - 8);
    }
    if (left < 8) left = 8;

    if (top + popupH > viewportH - 8) {
      const proposedTop = rect ? rect.top - popupH : (e.clientY - popupH);
      top = proposedTop < 8 ? Math.max(8, viewportH - popupH - 8) : proposedTop;
    }
    if (top < 8) top = 8;

    const pageLeft = left + window.scrollX;
    const pageTop = top + window.scrollY;

    this._popupLeft.set(`${pageLeft}px`);
    this._popupTop.set(`${pageTop}px`);
  }

  @HostListener('document:click', ['$event'])
  onDocClick = (e: MouseEvent) => {
    if (!this.open()) return;
    const target = e.target as HTMLElement | null;
    if (target && !target.closest('.nxg-column-filter')) {
      this.open.set(false);
    }
  };
}
