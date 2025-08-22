import { TestBed } from '@angular/core/testing';

import { NgxGridPaginationService } from './ngx-grid-pagination.service';

describe('NgxGridPaginationService', () => {
  let service: NgxGridPaginationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridPaginationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
