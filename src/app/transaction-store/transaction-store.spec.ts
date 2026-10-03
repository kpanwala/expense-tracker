import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionStore } from './transaction-store';

describe('TransactionStore', () => {
  let component: TransactionStore;
  let fixture: ComponentFixture<TransactionStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionStore],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionStore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
