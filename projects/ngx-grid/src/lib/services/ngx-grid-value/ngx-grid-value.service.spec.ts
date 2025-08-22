import { TestBed } from '@angular/core/testing';

import { NgxGridValueService } from './ngx-grid-value.service';

describe('NgxGridValueService', () => {
  let service: NgxGridValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridValueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
