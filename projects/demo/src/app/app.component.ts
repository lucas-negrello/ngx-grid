import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxGridComponent } from '../../../ngx-grid/src/lib/ngx-grid.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {


  event(event: any) {
    console.log(event);
  }

}
