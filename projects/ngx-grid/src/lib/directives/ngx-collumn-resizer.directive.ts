import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';
import { NgxGridService } from '../ngx-grid.service';
import { NgxGridLayoutService } from '../services/ngx-grid-layout/ngx-grid-layout.service';

@Directive({
  selector: '[ngxColumnResizer]',
})
export class NgxColumnResizerDirective implements OnDestroy {
  @Input({ required: true }) colId!: string | number;

  private moveUnlisten?: () => void;
  private upUnlisten?: () => void;
  private startX = 0;
  private startWidth = 0;

  constructor(
    private readonly _el: ElementRef<HTMLElement>,
    private readonly _renderer: Renderer2,
    private readonly _grid: NgxGridService,
    private readonly _layout: NgxGridLayoutService
  ) {
    this._renderer.addClass(this._el.nativeElement, 'ngx-col-resizer');
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    this.startX = ev.clientX;
    this.startWidth = this._layout.getColumnWidth(this.colId);

    document.body.classList.add('ngx-resize-cursor');

    const move = (e: MouseEvent) => {
      const dx = e.clientX - this.startX;
      this._layout.setColumnWidth(this.colId, this.startWidth + dx);
      this._grid.onInternalColumnResized?.(this.colId, this._layout.getColumnWidth(this.colId));
    };

    const up = () => {
      document.body.classList.remove('ngx-resize-cursor');
      this.cleanupListeners();
    };

    this.moveUnlisten = this._renderer.listen('document', 'mousemove', move);
    this.upUnlisten = this._renderer.listen('document', 'mouseup', up);
  }

  private cleanupListeners() {
    try { this.moveUnlisten?.(); } catch {}
    try { this.upUnlisten?.(); } catch {}
    this.moveUnlisten = undefined;
    this.upUnlisten = undefined;
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
  }
}
