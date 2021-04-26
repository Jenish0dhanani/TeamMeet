import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthGuard } from 'src/app/auth.guard'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import  {  NgxEmojiPickerModule  }  from  'ngx-emoji-picker';
import {DatePipe} from '@angular/common'
import {MatCardModule} from '@angular/material/card';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatRippleModule} from '@angular/material/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatBadgeModule} from '@angular/material/badge';

import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RegistrationComponent } from './user/registration/registration.component';
import { LoginComponent } from './user/login/login.component';
import { Routes, RouterModule, Router } from '@angular/router';
import { CommonModule } from "@angular/common";
import {MatInputModule} from '@angular/material/input'
import {ErrorStateMatcher, ShowOnDirtyErrorStateMatcher} from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CommonComponent } from './common/common.component';
import { UserProfileComponent } from './dashboard/user-profile/user-profile.component';
import { RoomComponent } from './dashboard/room/room.component';
import { VerifyComponent } from './user/verify/verify.component';

const appRoutes: Routes = [
  { path: 'registration', component: RegistrationComponent },
  { path: 'login', component: LoginComponent },
  {path: 'dashboard', component:DashboardComponent,children:[{path:'room',component:RoomComponent,pathMatch:'full'}],canActivate:[AuthGuard]},
  {path:'', redirectTo: 'registration', pathMatch: 'full'},
  {path:'**', redirectTo:'registration', pathMatch: 'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    RegistrationComponent,
    LoginComponent,
    CommonComponent,
    DashboardComponent,
    UserProfileComponent,
    RoomComponent,
    VerifyComponent
  ],
  imports: [
    CommonModule,
    NoopAnimationsModule,
    ReactiveFormsModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatTabsModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatRippleModule,
    MatToolbarModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
    MatGridListModule,
    MatCheckboxModule,
    HttpClientModule,
    // SocketIoModule.forRoot({url:'https://192.168.43.119:5000'}),
    RouterModule.forRoot(
      appRoutes,
      {enableTracing: true}
    ),
    NgxEmojiPickerModule,

  ],
  providers: [{provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher},DatePipe,{provide:MatDialogRef,useValue:{}}],
  bootstrap: [AppComponent]
})
export class AppModule { }
