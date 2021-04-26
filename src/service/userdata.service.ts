import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserdataService {

  constructor(private authService:AuthService) {}

  uid:any;
  userDetails={"id":"","fname":'',"lname":'','mobile':"",'email':"",'pass':""}
  // aa service ma userDetails che ema hu dashboard component ma thi add karu chu data ok ...?
  //pachi hu ene room ma fetch karavu to null ave che ...bol 


}
