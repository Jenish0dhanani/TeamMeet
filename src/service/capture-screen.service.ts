import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CaptureCameraService {

  constructor() { }

  capture(): Promise<MediaStream>{
    let nav = <any>navigator;
    if (nav.getUserMedia) {
      return nav.getUserMedia({video: true});
    } else if (nav.mediaDevices.getUserMedia) {
      return nav.mediaDevices.getUserMedia({video: true});
    } else {
      return nav.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
    }
  }
}