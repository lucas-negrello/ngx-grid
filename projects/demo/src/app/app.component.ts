import { Component } from '@angular/core';
import {NgxGridComponent} from '../../../ngx-grid/src/lib/ngx-grid.component';
import {NgxGridApi} from '../../../ngx-grid/src/lib/api/ngx-grid-api';
import {DEMO_USERS, demoServerFetcher, DemoUser} from './app.component.data';
import {NgxColDef} from '../../../ngx-grid/src/lib/models/ngx-col-def.model';
import {NgxGridOptions} from '../../../ngx-grid/src/lib/models/ngx-grid-options.model';

@Component({
  selector: 'app-root',
  imports: [NgxGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Ngx Grid Demo';
  api!: NgxGridApi<DemoUser>;

  rows: DemoUser[] = DEMO_USERS;

  serverFetcher = demoServerFetcher;

  // Definições de colunas
  cols: NgxColDef<DemoUser>[] = [
    { field: 'id', headerName: 'ID', width: 80, align: 'right', sortable: true },
    { field: 'name', headerName: 'Nome', width: 220, sortable: true },
    { field: 'email', headerName: 'E-mail', width: 260, sortable: true },
    { field: 'department', headerName: 'Departamento', width: 150, sortable: true },
    { field: 'country', headerName: 'País', width: 120, sortable: true },
    { field: 'age', headerName: 'Idade', width: 90, align: 'right', sortable: true },
    {
      field: 'salary',
      headerName: 'Salário',
      width: 120,
      align: 'right',
      sortable: true,
      valueFormatter: ({ value }) =>
        typeof value === 'number'
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
          : value,
    },
    {
      field: 'joinDate',
      headerName: 'Admissão',
      width: 140,
      sortable: true,
      valueFormatter: ({ value }) =>
        value instanceof Date ? value.toLocaleDateString('pt-BR') : new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      field: 'score',
      headerName: 'Score',
      width: 100,
      align: 'right',
      sortable: true,
      valueFormatter: ({ value }) => (typeof value === 'number' ? value.toFixed(1) : value),
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 110,
      sortable: true,
      valueFormatter: ({ value }) => (value ? 'Ativo' : 'Inativo'),
      cellClass: ({ value }) => (value ? 'text-green-700' : 'text-gray-500'),
    },
  ];

  // Opções do grid
  options: NgxGridOptions<DemoUser> = {
    paginationPageSize: 10,
    getRowId: ({ data }) => data.id,
    onRowClicked: (e) => console.log('Row clicked (options):', e),
    onSelectionChanged: (e) => console.log('Selection changed (options):', e.selected.length),
    onSortChanged: (e) => console.log('Sort changed (options):', e.sortModel),
  };

  // Eventos (component outputs)
  onApi(api: NgxGridApi<DemoUser>) {
    this.api = api;
    console.log('API pronta. Página atual:', api.getPageIndex(), 'Tamanho:', api.getPageSize());
    this.api.pageChange$?.subscribe((p) => console.log('pageChange$', p));
  }

  onRowClicked(e: any) {
    console.log('Row clicked (output):', e);
  }

  onSortChanged(e: any) {
    console.log('Sort changed (output):', e.sortModel);
  }

  onSelectionChanged(e: any) {
    console.log('Selection changed (output):', e.selected.length);
  }

  onPageChange(e: any) {
    console.log('Page changed (output):', e);
  }
}
