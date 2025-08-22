import { TestBed } from '@angular/core/testing';

import { NgxGridSortService } from './ngx-grid-sort.service';

describe('NgxGridSortService', () => {
  let service: NgxGridSortService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridSortService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
