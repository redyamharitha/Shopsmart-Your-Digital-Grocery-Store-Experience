// shopsmart-frontend/src/app/pipes/reverse.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'reverse',
  standalone: true // <-- THIS MUST BE TRUE
})
export class ReversePipe implements PipeTransform {
  transform(value: any[]): any[] {
    if (!value) {
      return [];
    }
    return [...value].reverse();
  }
}