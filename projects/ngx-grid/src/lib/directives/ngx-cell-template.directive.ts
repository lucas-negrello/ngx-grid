import {Directive, input, TemplateRef} from '@angular/core';

@Directive({
  selector: 'ng-template[ngxCell]'
})
export class NgxCellTemplateDirective {
  // TODO: Verify if it can be a signal input
  public colId = input.required<string>();

  // TODO: Verify this any type is appropriate or if it should be more specific
  constructor(public template: TemplateRef<any>) {}
}
