import {NgxColDef} from './ngx-col-def.model';
import {NgxDensity, NgxRowSelection} from './types';
import {
  NgxBaseEvent, NgxOnFilterChangesEvent,
  NgxOnPageChangesEvent, NgxOnRowClickChangesEvent, NgxOnSelectionChangesEvent, NgxOnSortChangesEvent
} from './events';

export interface NgxGridOptions<T = any> {
  defaultColDef?: Partial<NgxColDef<T>>;
  rowSelection?: NgxRowSelection;
  suppressMultiSort?: boolean;

  getRowId?: (params: { data: T; index: number}) => string | number;

  onRowClickChanges?: (event: NgxBaseEvent<T, NgxOnRowClickChangesEvent<T>>) => void;
  onSelectionChanges?: (event: NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>>) => void;
  onSortChanges?: (event: NgxBaseEvent<T, NgxOnSortChangesEvent<T>> ) => void;
  onPageChanges?: (event: NgxBaseEvent<T, NgxOnPageChangesEvent<T>>) => void;
  onFilterChanges?: (event: NgxBaseEvent<T, NgxOnFilterChangesEvent<T>>) => void;

  paginationPageSize?: number;
  paginationPageSizeOptions?: number[];

  globalFilterPredicate?: (row: T, text: string) => boolean;

  // Layout/UX
  density?: NgxDensity;
  striped?: boolean;
  hoverHighlight?: boolean;
  stickyHeader?: boolean;
  tableClass?: string;
  rowClass?: (params: { data: T; index: number }) => string | string[] | undefined | null;
}
