import {Component, signal} from '@angular/core';
import {NgxGridComponent} from '../../../ngx-grid/src/lib/ngx-grid.component';
import {NgxGridApi} from '../../../ngx-grid/src/lib/api/ngx-grid-api';
import {NgxColDef} from '../../../ngx-grid/src/lib/models/ngx-col-def.model';
import {NgxGridOptions} from '../../../ngx-grid/src/lib/models/ngx-grid-options.model';
import {
  NgxBaseEvent, NgxOnPageChangesEvent,
  NgxOnRowClickChangesEvent,
  NgxOnSelectionChangesEvent,
  NgxOnSortChangesEvent
} from '../../../ngx-grid/src/lib/models/events';
import {FormsModule} from '@angular/forms';

interface Person {
  id: number;
  name: string;
  age: number;
  email: string;
}

@Component({
  selector: 'app-root',
  imports: [NgxGridComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Ngx Grid Demo';
  api!: NgxGridApi<Person>;

  globalFilter = signal<string>('');

  rowData: Person[] = [
    { id: 1, name: 'Alice Johnson', age: 28, email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', age: 35, email: 'bob@work.com' },
    { id: 3, name: 'Charlie Brown', age: 22, email: 'charlie@domain.org' },
    { id: 4, name: 'Daniela Souza', age: 42, email: 'dani@empresa.com' },
    { id: 5, name: 'Eduardo Lima', age: 30, email: 'edu@teste.com' },
  ];

  // Agora com pin inicial e dimensões configuradas (resize ativo por padrão)
  columnDefs: NgxColDef<Person>[] = [
    { field: 'id', headerName: 'ID', width: 80, minWidth: 60, maxWidth: 120, sortable: true, pinned: 'start', filter: { enabled: false, operators: ['equals', 'gt', 'lt'] } },
    { field: 'name', headerName: 'Nome', width: 200, minWidth: 120, maxWidth: 360, sortable: true, filter: { enabled: true, placeholder: 'Filtrar nome...' } },
    { field: 'age', headerName: 'Idade', width: 100, minWidth: 80, maxWidth: 160, sortable: true, filter: { enabled: true, operators: ['equals', 'gt', 'gte', 'lt', 'lte'] } },
    { field: 'email', headerName: 'Email', width: 260, minWidth: 160, maxWidth: 480, sortable: true, pinned: 'end', filter: { enabled: true } },
  ];

  // Opções do grid (sem mudanças, apenas mantidas)
  gridOptions: NgxGridOptions<Person> = {
    enableColumnFilter: true,
    columnFilterDefaults: {
      showPopup: true,
      caseSensitive: false,
    },
    paginationPageSize: 2,

    density: 'compact',
    striped: true,
    hoverHighlight: true,
    stickyHeader: true,
    tableClass: 'custom-table',
    rowClass: ({ data }) => ((data.age > 30) ? 'row-active' : 'row-inactive'),

    getRowId: ({ data }) => data.id,
    onRowClickChanges: (e) => console.log('Row clicked (options):', e),
    onSelectionChanges: (e) => console.log('Selection changed (options):', e.event.selected.length),
    onSortChanges: (e) => console.log('Sort changed (options):', e.event.sortModel),
  };

  // API
  onApi(api: NgxGridApi<Person>) {
    this.api = api;
    console.log('API pronta. Página atual:', api.getPageIndex(), 'Tamanho:', api.getPageSize());
    this.api.pageChanges$?.subscribe((p) => console.log('pageChange$', p));
  }

  // Outputs (component)
  onRowClicked(e: NgxBaseEvent<Person, NgxOnRowClickChangesEvent<Person>>) {
    console.log('Row clicked (output):', e.event);
  }
  onSortChanged(e: NgxBaseEvent<Person, NgxOnSortChangesEvent<Person>>) {
    console.log('Sort changed (output):', e.event.sortModel);
  }
  onSelectionChanged(e: NgxBaseEvent<Person, NgxOnSelectionChangesEvent<Person>>) {
    console.log('Selection changed (output):', e.event.selected.length);
  }
  onPageChange(e: NgxBaseEvent<Person, NgxOnPageChangesEvent<Person>>) {
    console.log('Page changed (output):', e.event);
  }

  // Helpers para pin/unpin em runtime (atualiza o array de colDefs)
  pinStart(colId: string | number) {
    this.updateCol(colId, { pinned: 'start' });
  }
  pinEnd(colId: string | number) {
    this.updateCol(colId, { pinned: 'end' });
  }
  unpin(colId: string | number) {
    this.updateCol(colId, { pinned: null as any });
  }

  private updateCol(colId: string | number, patch: Partial<NgxColDef<Person>>) {
    this.columnDefs = this.columnDefs.map((c) =>
      (String(c.colId ?? c.field) === String(colId)) ? { ...c, ...patch } : c
    );
  }
}
