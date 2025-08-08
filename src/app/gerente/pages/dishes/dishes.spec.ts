import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dishes } from './dishes';

describe('Dishes', () => {
  let component: Dishes;
  let fixture: ComponentFixture<Dishes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dishes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dishes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
