import { Component, Inject, OnInit,AfterViewInit } from '@angular/core';
import { AuthService } from 'src/service/auth.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RegistrationComponent } from '../registration/registration.component';
import { Router } from '@angular/router';
import { timer, Subscription } from "rxjs";
import { Pipe, PipeTransform } from "@angular/core";

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {
  invaliderror: boolean=false;
  constructor(private authservice:AuthService,public dialogRef: MatDialogRef<RegistrationComponent>,
    @Inject(MAT_DIALOG_DATA) public data:{id:any},private router:Router) { debugger}
countDown!: any;
counter:any = 60;
tick = 1000;
button:boolean=false;
  ngOnInit(): void {
    console.log(this.data)
  }
  ngAfterViewInit(): void{
    this.countDown = timer(100, this.tick).subscribe(() => this.decresecounter());
    setTimeout(() => {
      this.button = true;
    }, 60000);
  }
  decresecounter(){
    --this.counter
    if(this.counter==0){
      this.countDown.unsubscribe()
      this.counter = "resend"
    }
  }

  checkOtp(value:any){
    console.log(value)
    console.log("from dialouge")
    if(this.data.id==""){
      this.authservice.verifyotp({"uid":this.data.id,"otp":value}).subscribe(result=>{
        console.log(result)
        if(result.msg=="verified"){
          this.invaliderror = false;
          this.dialogRef.close()
          this.router.navigate(['/login'])
        }
        if(result.msg=="Invalid"){
          this.invaliderror = true
        }
      })
    }
    console.log(this.data.id)
    this.authservice.verifyotp({"uid":this.data.id,"otp":value}).subscribe(result=>{
      console.log(result)
      if(result.msg=="verified"){
        this.invaliderror = false;
        this.dialogRef.close()
        this.router.navigate(['/login'])
      }
      if(result.msg=="Invalid"){
        this.invaliderror = true
      }
    })
  }

  resend(){
      this.authservice.resendotp({"uid":this.data.id}).subscribe(result=>{
        console.log(result);
      })
   
    this.button = false;
    this.counter=60;
    this.countDown = timer(0, this.tick).subscribe(() =>this.decresecounter());
    setTimeout(() => {
      this.button = true;
    }, 60000);
  }
}


@Pipe({
  name: "formatTime"
})
export class FormatTimePipe implements PipeTransform {
  transform(value: number): string {
    const minutes: number = Math.floor(value / 60);
    return (
      ("00" + minutes).slice(-2) +
      ":" +
      ("00" + Math.floor(value - minutes * 60)).slice(-2)
    );
  }
}
