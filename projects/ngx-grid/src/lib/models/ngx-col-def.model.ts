import {NgxAlignment, NgxFilterOperator, NgxPinnedSide, NgxSortDirection} from './types';
import {NgxColumnFilter} from './ngx-filter.model';

export interface NgxValueGetterParams<T = any> {
  data: T;
  colDef: NgxColDef<T>;
  colId: string | number;
  value: any;
  getValue: (path: string, data?: any) => any;
  rowIndex: number;
}

export interface NgxValueFormatterParams<T = any> extends NgxValueGetterParams<T> {}

export interface NgxCellRendererParams<T = any> extends NgxValueGetterParams<T> {
  formattedValue: string | number | null;
  selected: boolean;
}

export interface NgxRowNode<T = any> {
  id: number | string;
  data: T;
  rowIndex: number;
  selected: boolean;
}

export interface NgxColumnFilterOptions<T = any> {
  enabled?: boolean;
  showPopup?: boolean;
  operators?: NgxFilterOperator[];
  placeholder?: string;
  caseSensitive?: boolean;
}

export interface NgxColDef<T = any> {
  colId?: string | number;
  field?: keyof T & string | string;
  headerName?: string;
  headerTooltip?: string;
  sortable?: boolean;
  sort?: NgxSortDirection;
  sortIndex?: number;

  filter?: boolean | NgxColumnFilterOptions<T>;
  filterPredicate?: (value: any, filter: NgxColumnFilter<T>) => boolean;

  valueGetter?: (params: NgxValueGetterParams<T>) => any;
  valueFormatter?: (params: NgxValueFormatterParams<T>) => string | number | null;

  cellRenderer?: (params: NgxCellRendererParams<T>) => string | number | null;
  comparator?: (
    a: any,
    b: any,
    nodeA: NgxRowNode<T>,
    nodeB: NgxRowNode<T>,
    isInverted: boolean
  ) => number;

  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  pinned?: NgxPinnedSide;

  cellClass?: string | string[] | ((params: NgxCellRendererParams<T>) => string | string[] | null); //ver
  align?: NgxAlignment;
  headerAlign?: NgxAlignment;
  sticky?: boolean;
}
