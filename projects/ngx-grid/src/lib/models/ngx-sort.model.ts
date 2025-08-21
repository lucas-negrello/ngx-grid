import {NgxSortDirection} from './types';

export interface NgxSortModelItem {
  colId: string | number;
  sort: NgxSortDirection;
  sortIndex?: number;
}
