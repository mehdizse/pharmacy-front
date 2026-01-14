import { Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';

export const DATE_PROVIDER: Provider[] = [
  { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
  {
    provide: DateAdapter,
    useClass: NativeDateAdapter,
    deps: [MAT_DATE_LOCALE]
  },
  {
    provide: MAT_DATE_FORMATS,
    useValue: {
      parse: {
        dateInput: 'dd/MM/yyyy',
      },
      display: {
        dateInput: 'dd/MM/yyyy',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'dd/MM/yyyy',
        monthYearA11yLabel: 'MMMM yyyy',
      },
    },
  },
];
