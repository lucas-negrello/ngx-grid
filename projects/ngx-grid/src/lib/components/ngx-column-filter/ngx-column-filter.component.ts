import {Component, computed, HostListener, inject, input, signal} from '@angular/core';
import {NgxColDef, NgxColumnFilterOptions} from '../../models/ngx-col-def.model';
import {NgxGridService} from '../../ngx-grid.service';
import {NgxGridFilterService} from '../../services/ngx-grid-filter/ngx-grid-filter.service';
import {NgxGridOptions} from '../../models/ngx-grid-options.model';
import {NgxFilterOperator} from '../../models/types';

@Component({
  selector: 'ngx-column-filter',
  imports: [],
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

  public toggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (!this.enabled() || !this.options().showPopup) return;
    const c = this.current();
    this.operator.set(c?.operator ?? this.operator());
    this.value.set(c?.value ?? '');
    this.caseSensitive.set(c?.caseSensitive ?? this.options().caseSensitive);
    this.open.update(v => !v);
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

  @HostListener('document:click')
  closeOnOutside = () => {
    if (this.open()) this.open.set(false)
  };
}
