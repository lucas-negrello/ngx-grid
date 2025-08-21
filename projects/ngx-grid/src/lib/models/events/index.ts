import {NgxSortModelItem} from '../ngx-sort.model';

export interface NgxOnRowClickedEvent<T = any> {
  data: T;
  rowIndex: number;
}

export interface NgxOnSelectionChangedEvent<T = any> {
  selected: T[];
}

export interface NgxOnSortChangedEvent<T = any> {
  sortModel: NgxSortModelItem[];
}
