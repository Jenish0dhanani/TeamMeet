import { Component } from '@angular/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'teemmeet';
  constructor(){}
  ngOnInit():void{}
  navLinks = [
    {path: 'registration' , label: 'Registration'},
    {path: 'login', label: 'Login'},
  ]

  checkNav(){
    if(location.pathname=='/dashboard' || location.pathname=='/dashboard/room'){
      return false
    }
    return true
  }

}
