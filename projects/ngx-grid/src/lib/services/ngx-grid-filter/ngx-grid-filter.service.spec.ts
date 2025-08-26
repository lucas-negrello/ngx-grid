import { TestBed } from '@angular/core/testing';

import { NgxGridFilterService } from './ngx-grid-filter.service';

describe('NgxGridFilterService', () => {
  let service: NgxGridFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
