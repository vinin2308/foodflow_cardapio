import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservacaoModal } from './observacao-modal';

describe('ObservacaoModal', () => {
  let component: ObservacaoModal;
  let fixture: ComponentFixture<ObservacaoModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObservacaoModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservacaoModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
