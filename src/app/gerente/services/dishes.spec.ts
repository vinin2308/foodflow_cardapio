import { TestBed } from '@angular/core/testing';

import { Dishes } from './dishes';

describe('Dishes', () => {
  let service: Dishes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dishes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
