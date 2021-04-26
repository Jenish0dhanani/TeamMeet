import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/myerrorstatematcher';
import {AuthService} from 'src/service/auth.service';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { VerifyComponent } from '../verify/verify.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  matcher = new MyErrorStateMatcher();
  msg:string="";
  uid:any;
  navShow:boolean = true;
  constructor(private router:Router,private fb: FormBuilder, private authService:AuthService, private _snackBar: MatSnackBar,private dialog:MatDialog) {
    this.form = this.fb.group({
      emailctrl: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {}


  horizontalPosition: MatSnackBarHorizontalPosition = 'right';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  durationInSeconds = 5;

  openSnackBar(message: string, action: string, className: string) {

    this._snackBar.open(message, action, {
     duration: 5000,
     verticalPosition: 'top',
     horizontalPosition: 'right',
     panelClass: [className],
   });
}
  get emailctrl(): any {
    return this.form.get('emailctrl');
  }

  get password(): any {
    return this.form.get('password');
  }

  hide = true;

  onLogin(f: any): void {
    this.authService.login({email:f.value.emailctrl,pass:f.value.password}).subscribe(
      data=> {
        console.log("Response Receiverd"+JSON.stringify(data))
        this.msg=JSON.stringify(data.msg)

        if(data.msg=="not-verified"){
          debugger
          // console.log(this.emailctrl.value)
          this.openDialog(data.id)
        }
        else{
          const token=JSON.stringify(data.token);
        // console.log(token);
        localStorage.setItem('token',token)
        // this.openSnackBar(data.msg,'Close','blue-snackbar');
        this.getuserdata()
        this.router.navigate(['dashboard']);
        }
      },
      error => {console.error("Exception"+JSON.stringify(error.error));
      this.msg= JSON.stringify(error.error);
      this.form.setErrors({'Invalid':true});
      this.form.reset()
      this.openSnackBar(error.error,'Close','red-snackbar');
      // console.log(this.form);
      // console.log(this.msg);  
    }
    )
    // console.log('VALUE'+temp);
  }

  openDialog(id:any): void {
    const dialogRef = this.dialog.open(VerifyComponent,{
      width: '550px',
      // maxHeight: '90vh'
      height:'auto',
      data: {
        id:id
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

  getuserdata(){
    this.authService.verify().subscribe(
      (value:any)=> {
        if(value){
          console.log('value is ...'+JSON.stringify(value))
          this.uid = value.user.id
          localStorage.setItem('uid',value.user.id)
        }
      }
    );
  }
}


