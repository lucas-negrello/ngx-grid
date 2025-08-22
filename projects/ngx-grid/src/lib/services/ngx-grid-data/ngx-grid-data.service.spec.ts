import { TestBed } from '@angular/core/testing';

import { NgxGridDataService } from './ngx-grid-data.service';

describe('NgxGridDataService', () => {
  let service: NgxGridDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
