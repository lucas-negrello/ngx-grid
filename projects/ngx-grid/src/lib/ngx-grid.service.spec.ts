import { TestBed } from '@angular/core/testing';

import { NgxGridService } from './ngx-grid.service';

describe('NgxGridService', () => {
  let service: NgxGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
