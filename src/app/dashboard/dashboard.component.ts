import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/service/auth.service';
import { UserdataService } from 'src/service/userdata.service';
import { RoomComponent } from './room/room.component';
import { UserProfileComponent } from './user-profile/user-profile.component'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit { 
  static uid="";
  unbounded = false;
  user={"id":"","fname":'',"lname":'','mobile':"",'email':"",'pass':""};
  isLoggedIn:boolean=false;
  profileurl = "";
  constructor(private router:Router,private authService:AuthService,public dialog: MatDialog, private userdata:UserdataService) { 
    
  }
  checkRoom(){
    if(location.pathname=='/dashboard/room'){
      return false
    }
    return true
  }

  async ngOnInit(): Promise<void> {
    DashboardComponent.uid="";
    await this.dashboard();
    this.userdata.uid = DashboardComponent.uid;
  }
  isRoom(){
    if(location.pathname=='/dashboard/room'){return false}
    return true
  } 

  dashboard(){
    DashboardComponent.uid = this.userdata.uid
    // localStorage.setItem('uid',DashboardComponent.uid)
    this.authService.verify().subscribe(
      (data)=> {
        if(data){
          // console.log(data);
          // console.log("Response Receiverd"+JSON.stringify(data))
          console.log(data.user.id)
          this.authService.getProfile(data.user.id).subscribe(res=>{
            console.log(res)
            this.profileurl = this.authService.baseurl+res
          })
          DashboardComponent.uid=JSON.stringify(data.user.id);
          this.userdata.uid = DashboardComponent.uid
          
          this.authService.getUser(DashboardComponent.uid).subscribe(
            (data)=>{
              if(data){
                this.user=data;
                // console.log(this.user)
                this.userdata.userDetails=this.user
              }
              else{
                console.error("exception no response from api");
              }
            },
            error=>{console.error("exception"+JSON.stringify(error))}
          );
        }
      },
      error => {console.log("Exception"+JSON.stringify(error.error));
    });
  }
  
  openDialog(): void {
    const dialogRef = this.dialog.open(UserProfileComponent,{
      width: '550px',
      // maxHeight: '90vh'
      height:'auto'
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

  get userid(){
    return DashboardComponent.uid
  }

  LogOut(){
    // location.reload()
    localStorage.removeItem('token');
    sessionStorage.removeItem('uid');
    DashboardComponent.uid="";
    this.user={"id":"","fname":'',"lname":'','mobile':"",'email':"",'pass':""};
    this.router.navigate(['login']); 
  }
}
