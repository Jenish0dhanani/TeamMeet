import {
	Component,
	Inject,
	OnInit
} from '@angular/core';
import {
	UserdataService
} from 'src/service/userdata.service';
import {
	BreakpointObserver,
	Breakpoints
} from '@angular/cdk/layout';
import {
	FormBuilder,
	FormGroup,
	Validators
} from '@angular/forms';
import {
	UsernameValidator
} from 'src/app/validators';
import {
	AuthService
} from 'src/service/auth.service';
import {
	DashboardComponent
} from '../dashboard.component';
import {
	MatDialogRef,
} from '@angular/material/dialog';
import {
	MatSnackBar
} from '@angular/material/snack-bar';
import { expandCollapse } from 'src/app/animations';


@Component({
	selector: 'app-user-profile',
	templateUrl: './user-profile.component.html',
	styleUrls: ['./user-profile.component.css'],
	animations:[expandCollapse]

})
export class UserProfileComponent implements OnInit {

	constructor(public dialogRef: MatDialogRef < DashboardComponent > , private userdata: UserdataService, private breakpointObserver: BreakpointObserver, private fb: FormBuilder, private authService: AuthService, private snackBar: MatSnackBar) {
		this.updateForm = this.fb.group({
			lname: ['',
				[Validators.required,
					Validators.pattern('^[a-zA-Z \-\']+'),
					Validators.maxLength(15),
					UsernameValidator.cannotContainSpace
				],
			],
			fname: ['',
				[Validators.required,
					Validators.pattern('^[a-zA-Z \-\']+'),
					Validators.maxLength(15),
					UsernameValidator.cannotContainSpace
				]
			],
			mobile: ['',
				[Validators.required,
					Validators.pattern('^[6-9][0-9]{9}$')
				]
			],
			changePasswordCheckBox: [''],
			oldPassword: ['',
				[Validators.required, ]
			],
			newPassword: ["", [Validators.required]]
		});
	}

  get fname():any { return this.updateForm.get('fname'); }
  get lname():any { return this.updateForm.get('lname'); }
  get mobile():any { return this.updateForm.get('mobile'); }
  
  updateForm: FormGroup;
	// fname: any = "";
	// lname: any = "";
	msg = "";
	changePasswordCheck = false;
	hide = true;
	hide1 = true;
	cols = "2";

	uservalue = {
		"id": '',
		'fname': "",
		'lname': "",
		'mobile': "",
		'pass': ""
	};
	ngOnInit(): void {
		this.uservalue = this.userdata.userDetails// je user login thay eni id joti mare room component ma to dashboard ma id store karv service ma e to thayaj che ok
		//fill form value
		this.updateForm.setValue({
			"fname": this.uservalue.fname,
			"lname": this.uservalue.lname,
			"mobile": this.uservalue.mobile,
			"changePasswordCheckBox": false,
			"oldPassword": "",
			"newPassword": ""
		});

		this.breakpointObserver.observe([
			'(max-width: 768px)'
		]).subscribe(result => {
			if (result.matches) {
				this.cols = "1"
			} else {
				this.cols = "2"
			}
		});
	}


	onCheck() {
		if (this.updateForm.get('changePasswordCheckBox')?.value == false) {
			this.updateForm.get('changePasswordCheckBox')?.setValue(true)
			this.changePasswordCheck = true
		} else {
			this.updateForm.get('changePasswordCheckBox')?.setValue(false)
			this.changePasswordCheck = false
		}
	}

	isExpanded: boolean=false;

  	toggle() { 
    	this.isExpanded = !this.isExpanded;
  	}

	//onupdate
	onUpdate(f: FormGroup) {
		if (f.value.changePasswordCheckBox == true) {//if checkbox is checked
			if (f.value.oldPassword == '' || f.value.newPassword == '' || f.value.fname == "" || f.value.lname == "" || f.value.mobile == "") {
				this.snackBar.open("Please Fill All Required Fields", 'close', {
					"duration": 5000,
					"panelClass": "red-snackbar",
					"horizontalPosition": "right",
					"verticalPosition": "top"
				});
			} else {
				console.log("form value of update" + JSON.stringify(f.value))
				this.authService.updateUser(this.uservalue.id, f.value).subscribe(
					data => {
						console.log("Response Receiverd" + JSON.stringify(data))
						this.msg = JSON.stringify(data.msg)
						this.snackBar.open("User Updated", 'close', {
							"duration": 5000,
							"panelClass": "blue-snackbar",
							"horizontalPosition": "right",
							"verticalPosition": "top"
						});
						this.dialogRef.close();
					},
					error => {
						console.log("Exception" + JSON.stringify(error.error));
						this.msg = JSON.stringify(error.error);
						this.snackBar.open("Wrong Password", 'close', {
							"duration": 5000,
							"panelClass": "red-snackbar",
							"horizontalPosition": "right",
							"verticalPosition": "top"
						});
						this.updateForm.dirty
						this.updateForm.get('oldPassword')?.setErrors({
							'invalid': true
						})
						return null
					}
				)
			}
		} else {
			if (f.value.fname == "" || f.value.lname == "" || f.value.mobile == "") {
				this.snackBar.open("Please Fill All Required Fields", 'close', {
					"duration": 5000,
					"panelClass": "red-snackbar",
					"horizontalPosition": "right",
					"verticalPosition": "top"
				});
			} else {
				console.log("form value of update" + JSON.stringify(f.value))
				this.authService.updateUser(this.uservalue.id, f.value).subscribe(
					data => {
						console.log("Response Receiverd" + JSON.stringify(data))
						this.msg = JSON.stringify(data.msg)
						this.snackBar.open("User Updated", 'close', {
							"duration": 5000,
							"panelClass": "blue-snackbar",
							"horizontalPosition": "right",
							"verticalPosition": "top"
						});
						this.dialogRef.close();
					},
					error => {
						console.log("Exception" + JSON.stringify(error.error));
						this.msg = JSON.stringify(error.error);
						this.snackBar.open("Wrong Password", 'close', {
							"duration": 5000,
							"panelClass": "red-snackbar",
							"horizontalPosition": "right",
							"verticalPosition": "top"
						});
						this.updateForm.dirty
						this.updateForm.get('oldPassword')?.setErrors({
							'invalid': true
						})
					}
				)
				
			}

		}
	}

}