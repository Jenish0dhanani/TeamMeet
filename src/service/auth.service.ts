import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({providedIn: 'root'})
export class AuthService{
    constructor(private http: HttpClient){}

    // baseurl='https://192.168.43.119:5000'
    baseurl='https://localhost:5000'
    
    // console.log(id)
    public async upload(data:any,userid:string):Promise<Observable<any>>{
        var id = Math.floor(100000 + Math.random() * 900000)
        return await this.http.post(this.baseurl+'/auth/upload/'+id+'/'+userid,data,{responseType: 'text'})
    }

    public login(credentials:any):Observable<any>{
        return this.http.post<any>(this.baseurl+'/auth/login',credentials);
    }

    public register(data:any):Observable<any>{
        return this.http.post<any>(this.baseurl+'/auth/register',data);
    }

    public verify():Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.get(this.baseurl+'/auth/verify',{'headers':headers});
    }
    
    public getUser(id:any):Observable<any>{
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.get(this.baseurl+'/auth/user/'+id,{'headers':headers});
    }
    
    loggedIn(){
        return !!localStorage.getItem('token')
    }

    public updateUser(id:any,data:any):Observable<any>{
        console.log(id)
        let token:any = localStorage.getItem('token')
        let headers = new HttpHeaders()
        	.set('token',token);
        return this.http.post(this.baseurl+'/auth/update/'+id,data,{'headers':headers});
    }

    public async setProfile(data:any):Promise<Observable<any>>{
        console.log(data);debugger
        console.log(this.baseurl+'/auth/setprofile/');
         
        return await this.http.post(this.baseurl+'/auth/setprofile/',data)
    }
    // error node ma ave che jo angular ma nai ha to kar kaik me aane json.stringify karavyu to che chalav farithi 
    public getProfile(id:any):Observable<any>{
        console.log(id); 
        return this.http.get(this.baseurl+'/auth/profilepic/'+id,{responseType:"text"})
    }

    public verifyotp(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/validateotp',data)
    }

    public resendotp(data:any):Observable<any>{
        return this.http.post(this.baseurl+'/auth/resendotp',data)
    }
}   


