import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BofaDesignSystemModule } from 'bofa-design-system';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

/**
 * advisor-console is a separate downstream team's app that consumes
 * bofa-design-system independently of digital-banking-shell. It exists
 * in this demo purely to prove out the "cannot break downstream builds"
 * constraint -- any breaking change to the shared library surfaces as a
 * compile/build failure here, not just in the shell app.
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    BofaDesignSystemModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
