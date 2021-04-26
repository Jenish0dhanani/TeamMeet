import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RestApiServiceService {

  constructor(private http: HttpClient) { 

    
  }
  createRecord(info:any){
    debugger;
    return this.http.post('http://localhost:8081/register',info);
  }
}
