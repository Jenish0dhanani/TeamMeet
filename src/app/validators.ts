import { HttpClient } from '@angular/common/http';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/service/auth.service';
import { UserdataService } from 'src/service/userdata.service';
  
export class UsernameValidator {
    static cannotContainSpace(control: AbstractControl) : ValidationErrors | null {
        if(control.value!=null && (control.value as string).indexOf(' ') >= 0){
            return {cannotContainSpace: true}
        }
  
        return null;
    }
}

export function passvalidator(control: AbstractControl){
    if (control && (control.value !== null || control.value !== undefined)){
        const cnfpassvalue= control.value;

        const passcontrol = control.root.get('password');
        if(passcontrol){
            const passvalue = passcontrol.value;
            if(passvalue !== cnfpassvalue){
                return{ notmatched: true}
            }
        }
    }return null;
}

export class OldPasswordCheck{
    constructor(public userdata:UserdataService){}
    newIsNotOld(group: FormGroup){
        var newPW = group.controls['newPW'];

        if(this.userdata.userDetails !== newPW.value)
            newPW.setErrors({ newIsNotOld: true });
        return null;
    }
}