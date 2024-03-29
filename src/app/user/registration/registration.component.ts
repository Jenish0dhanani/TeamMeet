import { Component,OnInit, ViewChild} from '@angular/core';
import {FormBuilder,FormGroup,FormGroupDirective,Validators} from '@angular/forms';
import { UsernameValidator, passvalidator } from 'src/app/validators';
import { MyErrorStateMatcher } from 'src/app/myerrorstatematcher';
import { AuthService } from 'src/service/auth.service';
import { MatDialog } from '@angular/material/dialog';
import {
  MatSnackBar,
  MatSnackBarHorizontalPosition,
  MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';
import { VerifyComponent } from '../verify/verify.component';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})

export class RegistrationComponent {
  form: FormGroup;
  matcher= new MyErrorStateMatcher();
  msg="";
  @ViewChild(FormGroupDirective) formGroupDirective: FormGroupDirective | undefined;
  constructor(private fb: FormBuilder, private authService:AuthService,private _snackBar: MatSnackBar,private dialog:MatDialog) {
    this.form = this.fb.group({
      lnamectrl: ['', 
        [Validators.required,
        Validators.pattern('^[a-zA-Z \-\']+'),
        Validators.maxLength(15),
        UsernameValidator.cannotContainSpace
      ],
      ],
      fnamectrl: ['',
        [Validators.required,
        Validators.pattern('^[a-zA-Z \-\']+'),
        Validators.maxLength(15),
        UsernameValidator.cannotContainSpace]
      ],
      emailctrl: ['',
        [Validators.required,
        Validators.email]
      ],
      mobileno: ['',
        [Validators.required,
        Validators.pattern('^[6-9][0-9]{9}$')]
      ],
      password: ['',
          [Validators.required,]
      ],
      
      confirmpassword: ['',
          [Validators.required, passvalidator]
      ]
      

    });
}

  ngOnInit(): void{}
  get lnamectrl(): any {
    return this.form.get('lnamectrl')
  }

  get fnamectrl(): any {
    return this.form.get('fnamectrl');
  }

  get emailctrl(): any {
    return this.form.get('emailctrl');
  }

  get password(): any {
    return this.form.get('password');
  }

  get mobileno(): any{
    return this.form.get('mobileno');
  }

  get confirmpassword(): any {
    return this.form.get('confirmpassword');
  }
  url:any="";
  selectedFile:any ;
  button:boolean = false;
  uploadErr:boolean = false;
  fileGreaterErr:boolean=false;
  onFileSelected(event:any){
    
    if(event.target.files){
      var reader = new FileReader()
      reader.readAsDataURL(event.target.files[0]);
      if(event.target.files[0].size > 3000000){
        this.fileGreaterErr = true;
        ('file size is greter then 3 mb');

        var profilediv = document.getElementById('upload-profile')
        //@ts-ignore
        profilediv.style.width = "100%"
        var profiledivimg = document.getElementById('upload-profile-img')
        //@ts-ignore
        profiledivimg.style.display = "none"
        this.button = false;
        this.selectedFile= null;
      

    } else {
      this.fileGreaterErr =false;
      this.selectedFile = <File>event.target.files[0];
      if(this.selectedFile){
        this.button = true;
        this.uploadErr = false;
        //have aaya width 50% kr bey div ne and img saw karvani display inline kr?? hello?
        var profilediv = document.getElementById('upload-profile')
        //@ts-ignore
        profilediv.style.width = "50%"
        var profiledivimg = document.getElementById('upload-profile-img')
        //@ts-ignore
        profiledivimg.style.display = "inline-block"
        
      }
    }
      reader.onload = (e:any)=>{
        this.url = e.target.result
      }
    }

    
  }
  uploadCheck(){
    if(!this.selectedFile){
      
      setTimeout(() => {
        this.uploadErr = true;  
      }, 500);
    } 
    if(this.selectedFile) {
      
        this.uploadErr = false;  
      
    }
  }
  //aa onupload call to karavu padse ne
  data:any;
  profileurl:any;
  async onUpload(id:string){
    const fd = new FormData()
    fd.append('file',this.selectedFile);
    (await this.authService.upload(fd, id)).subscribe(async res=>{
      console.log(res);
      this.profileurl = res

      this.data ={'uid':id,'url':this.profileurl} ;
      
      console.log(this.data)
      debugger
   
          (await this.authService.setProfile(this.data)).subscribe(res=>{
            console.log('responce from registration component ')
            console.log(res)
            debugger // call me
          });
    })

    // 
   //thayu k  
  }
  
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

  fname:any = "";
  lname:any = "";
  email:any="";
  hide = true;
  hide1 = true;

  user = {fname:"",lname:"",mobile:"",email:"",pass:""};

  onRegister(f: FormGroup): void {
    if(f.valid){
     this.user={fname:f.value.fnamectrl,lname:f.value.lnamectrl,mobile:f.value.mobileno,email:f.value.emailctrl,pass:f.value.password}
    this.authService.register(this.user).subscribe(
      data=> {
        ("Response Receiverd"+JSON.stringify(data))
        console.log(data)
        var id = data.id
        this.msg= JSON.stringify(data.msg);
        this.openSnackBar(JSON.stringify(data.msg),'Close','blue-snackbar');
        this.onUpload(data.id)
        this.url = ""
        this.selectedFile = ""
        this.button = false
        var profilediv = document.getElementById('upload-profile')
      //@ts-ignore
        profilediv.style.width = "100%"
        var profiledivimg = document.getElementById('upload-profile-img')
        //@ts-ignore
        profiledivimg.style.display = "none"
        // this.form.reset();
        // this.form.clearValidators
        setTimeout(() => 
        this.formGroupDirective?.resetForm(), 0)
        this.openDialog(id)
      },
      error => {console.log("Exception"+JSON.stringify(error.error));
      this.msg= JSON.stringify(error.error);
      
      this.form.setErrors({'Invalid':true});
      this.form.reset()
      
      this.openSnackBar(error.error,'Close','red-snackbar'); 
    }
    )
    }
   
  }
  
  openDialog(id:any): void {debugger
    const dialogRef = this.dialog.open(VerifyComponent,{
      width: '550px',
      // maxHeight: '90vh'
      height:'auto',
      data: {
        id: id
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      this.ngOnInit();
    });
  }

}
