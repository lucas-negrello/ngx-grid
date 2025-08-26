import {Signal} from '@angular/core';
import {Observable} from 'rxjs';
import {NgxColDef} from './ngx-col-def.model';
import {NgxGridOptions} from './ngx-grid-options.model';
import {NgxPaginationMode, NgxRowSelection} from './types';
import {NgxServerFetcher} from './ngx-pagination.model';
import {
  NgxBaseEvent, NgxOnFilterChangesEvent,
  NgxOnPageChangesEvent, NgxOnRowClickChangesEvent, NgxOnSelectionChangesEvent, NgxOnSortChangesEvent
} from './events';
import {NgxGridApi} from '../api/ngx-grid-api';
import {NgxColumnFilter} from './ngx-filter.model';

export interface NgxGridInputs<T = any> {
  rowData: Signal<T[]>;
  rowData$: Signal<Observable<T[]> | null>;
  columnDefs: Signal<NgxColDef<T>[]>;
  defaultColDef: Signal<Partial<NgxColDef<T>> | null>;
  gridOptions: Signal<NgxGridOptions<T> | null>;
  rowSelection: Signal<NgxRowSelection>;
  paginationMode: Signal<NgxPaginationMode>;
  serverFetcher: Signal<NgxServerFetcher<T> | null>;
  pageSizeOptions: Signal<number[]>;
  filterText: Signal<string>;
  columnFilters: Signal<NgxColumnFilter<T>[] | Record<string, any> | null>;
}

export interface NgxGridOutputs<T = any> {
  rowClicked: { emit: (e: NgxBaseEvent<T, NgxOnRowClickChangesEvent<T>>) => void };
  selectionChanged: { emit: (e: NgxBaseEvent<T, NgxOnSelectionChangesEvent<T>>) => void };
  sortChanged: { emit: (e: NgxBaseEvent<T, NgxOnSortChangesEvent<T>>) => void };
  pageChanged: { emit: (e: NgxBaseEvent<T, NgxOnPageChangesEvent<T>>) => void };
  filterChanged: { emit: (e: NgxBaseEvent<T, NgxOnFilterChangesEvent<T>>) => void };
  apiReady: { emit: (api: NgxGridApi<T>) => void };
}
