import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxGridComponent } from './ngx-grid.component';

describe('NgxGridComponent', () => {
  let component: NgxGridComponent;
  let fixture: ComponentFixture<NgxGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
