import { TestBed } from '@angular/core/testing';

import { NgxGridColumnService } from './ngx-grid-column.service';

describe('NgxGridColumnService', () => {
  let service: NgxGridColumnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridColumnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
