import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManualEntryModal } from './manual-entry-modal';

describe('ManualEntryModal', () => {
  let component: ManualEntryModal;
  let fixture: ComponentFixture<ManualEntryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualEntryModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ManualEntryModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
