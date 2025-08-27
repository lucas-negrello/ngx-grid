import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxColumnFilterComponent } from './ngx-column-filter.component';

describe('NgxColumnFilterComponent', () => {
  let component: NgxColumnFilterComponent;
  let fixture: ComponentFixture<NgxColumnFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxColumnFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxColumnFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
