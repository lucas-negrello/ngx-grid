import { TestBed } from '@angular/core/testing';

import { NgxGridSelectionService } from './ngx-grid-selection.service';

describe('NgxGridSelectionService', () => {
  let service: NgxGridSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxGridSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
