import { TestBed } from '@angular/core/testing';

import { NgxGridLayoutService } from './ngx-grid-layout.service';

describe('NgxGridLayoutService', () => {
  let service: NgxGridLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridLayoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
