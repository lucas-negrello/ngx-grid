import {NgxColDef} from './ngx-col-def.model';
import {NgxRowSelection} from './types';
import {NgxOnPageChangedEvent, NgxOnRowClickedEvent, NgxOnSelectionChangedEvent, NgxOnSortChangedEvent} from './events';

export interface NgxGridOptions<T = any> {
  defaultColDef?: Partial<NgxColDef<T>>;
  rowSelection?: NgxRowSelection;
  suppressMultiSort?: boolean;

  getRowId?: (params: { data: T; index: number}) => any;

  onRowClicked?: (event: NgxOnRowClickedEvent<T>) => void;
  onSelectionChanged?: (event: NgxOnSelectionChangedEvent<T>) => void;
  onSortChanged?: (event: NgxOnSortChangedEvent<T> ) => void;
  onPageChanged?: (event: NgxOnPageChangedEvent<T>) => void;

  paginationPageSize?: number;
  paginationPageSizeOptions?: number[];
}
