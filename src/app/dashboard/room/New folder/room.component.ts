// @ts-nocheck  
import { Component, ElementRef, OnInit, Renderer2, ViewChild, HostListener } from "@angular/core";
import { Router } from "@angular/router";
import * as io from 'socket.io-client'
import { UserdataService } from "src/service/userdata.service";
import { MatSnackBar } from '@angular/material/snack-bar';
import {DatePipe} from '@angular/common'
import { validateVerticalPosition } from "@angular/cdk/overlay";

@Component({
    selector: 'app-room',
    templateUrl: 'room.component.html',
    styleUrls: ['room.component.css']
})
export class RoomComponent implements OnInit  {
  @ViewChild('remoteVideo')remoteVideoComponent:ElementRef|any;
  @ViewChild('roominput') roominput: ElementRef|any;
  @ViewChild('roomSelectionContainer')roomSelectionContainer:ElementRef|any;
  @ViewChild('video_chat_container') videoChatContainer: ElementRef|any;
  @ViewChild('local_video')localVideoComponent:ElementRef|any;
  @ViewChild('btn_ctrl')btnCtrl:ElementRef|any;
  private localStream = new MediaStream;
  private remoteStream = new MediaStream;
  private screenShareStream = new MediaStream;
  rtcPeerConnection:any
  isRoomCreator:any;
  peer:any;
  peers = {};
  roomId:any;
  message:string='';
  islocalmuted=false;
  islocalplay=true;
  isScreenShared=false;
  isChatOn:boolean = true;
  myvideo=document.createElement("video")
  url: string='https://192.168.43.119:5000'
  // url:string='https://localhost:5000'
  socket = io(this.url)
  remotevid:any
  mediaConstrain = {
    video:{width:{max:1920, ideal:1280, min:1024},height:{max:1080, ideal:720, min:576},facingMode: { exact: "user" }},
    audio:{echoCancellation: true,noiseSuppression: true}
  }
  iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  }
  toggled: boolean = false;
  msgbox = document.getElementById('msgbox')
    handleSelection(event){
      console.log(event.char);
      this.message += event.char
      this.toggled =! this.toggled
    }
  
  constructor(private renderer:Renderer2,private userdata:UserdataService,private router:Router,private snack: MatSnackBar,private datePipe: DatePipe) { 
    console.log(this.socket)
  }

    
  async ngOnInit() {}

  async ngAfterViewInit(){
    
    this.localVideoComponent
    console.log(this.remoteVideoComponent)
    this.remotevid=this.remoteVideoComponent
    // this.joinRoom(this.roominput.nativeElement.value)

    this.socket.on('room_created', async () => {
      console.log('Socket event callback: room_created')
    
      await this.setLocalStream(this.mediaConstrain)
      this.isRoomCreator = true
    })
    
    this.socket.on('room_joined', async () => {
      console.log('Socket event callback: room_joined')
    
      await this.setLocalStream(this.mediaConstrain)
      this.socket.emit('start_call', this.roomId)
    })
    
    this.socket.on('full_room', () => {
      console.log('Socket event callback: full_room')
    
      alert('The room is full, please try another one')
      this.router.navigate(['dashboard'])
      
    })
    
    this.socket.on('start_call', async () => {
      console.log('Socket event callback: start_call')
    
      if (this.isRoomCreator) {
        this.rtcPeerConnection = new RTCPeerConnection(this.iceServers)
        this.addLocalTracks(this.rtcPeerConnection)
        let video = document.createElement('video')
        video.id = "local-video"
        this.rtcPeerConnection.ontrack = (event)=>{
          this.setRemoteStream(event,video)
        }
        
        this.rtcPeerConnection.onicecandidate=(event)=>{
          this.sendIceCandidate(event,this.socket)
        }
        
        await this.createOffer(this.rtcPeerConnection)
      }
    })
    
    this.socket.on('webrtc_offer', async (event) => {
      console.log('Socket event callback: webrtc_offer')
    
      if (!this.isRoomCreator) {
        this.rtcPeerConnection = new RTCPeerConnection(this.iceServers)
        this.addLocalTracks(this.rtcPeerConnection)
        let video = document.createElement('video')
        this.rtcPeerConnection.ontrack = (event)=>{
          
          this.setRemoteStream(event,video)
        }
        this.rtcPeerConnection.onicecandidate = (event)=>{
          this.sendIceCandidate(event,this.socket)
        }
        
        this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        await this.createAnswer(this.rtcPeerConnection)
      }
    })  
    
    this.socket.on('webrtc_answer', (event) => {
      console.log('Socket event callback: webrtc_answer')
      this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    })
    
    this.socket.on('webrtc_ice_candidate', (event) => {
      console.log('Socket event callback: webrtc_ice_candidate')
    
      // ICE candidate configuration.
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
      })
      this.rtcPeerConnection.addIceCandidate(candidate)
    })

    this.socket.on('leave',(roomId)=>{
      this.handleRemoteHangup(roomId)
    })
    //message from websocket
    this.socket.on('message-broadcast',(msg,date)=>{
      if (msg) {
        const element = document.createElement('li');
        var date = this.datePipe.transform(date,'h:mm a')
        element.innerHTML =msg +' &nbsp;<sub><small style="font-size:small; color:lightgrey">'+date+'</small></sub>';
        element.classList.add("msg");
        // element.style.background = 'white';
        // element.style.color = 'black';
        // element.style.padding =  '15px 30px';
        // element.style.margin = '10px';
        document.getElementById('message-list').appendChild(element);
        var items = document.querySelectorAll("li");
        var last = items[items.length-1];
        last.scrollIntoView();
        }
    })

  }
  ///copy
  joinRoom(room:any) {
    if (room === '') {
      alert('Please type a room ID')
    } else {
      this.roomId = room
      this.socket.emit('join', room)
      this.showVideoConference()
      var msgcontainer = document.getElementById('msg-container')
      // msgcontainer?.style.display = 'block';
    }
  }

  showVideoConference() {
    this.roomSelectionContainer.nativeElement.style = 'display: none'
    this.videoChatContainer.nativeElement.style = 'display: contents;'
    this.btnCtrl.nativeElement.style = 'display:flex;'
    console.log(this.btnCtrl)
  }
  
  async setLocalStream(mediaConstraints: MediaStreamConstraints | undefined) {
  
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      
      console.log(stream)
    } catch (error) {
      console.error('Could not get user media', error)
    }
    
    //@ts-ignore
    this.localStream = stream
    this.localVideoComponent.nativeElement.srcObject = this.localStream
    this.muteUnmute()
    console.log(this.localVideoComponent)
  }
  
  addLocalTracks(rtcPeerConnection:any) {
    this.localStream.getTracks().forEach((track) => {
      rtcPeerConnection.addTrack(track, this.localStream)
    })
  }
  
  async createOffer(rtcPeerConnection:any) {
    let sessionDescription
    try {
      sessionDescription = await rtcPeerConnection.createOffer()
      rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
      console.error(error)
    }
  
    this.socket.emit('webrtc_offer', {
      type: 'webrtc_offer',
      sdp: sessionDescription,
      roomId:this.roomId,
    })
  }
  
  async createAnswer(rtcPeerConnection:any) {
    let sessionDescription
    try {
      sessionDescription = await rtcPeerConnection.createAnswer()
      rtcPeerConnection.setLocalDescription(sessionDescription)
    } catch (error) {
      console.error(error)
    }
  
    this.socket.emit('webrtc_answer', {
      type: 'webrtc_answer',
      sdp: sessionDescription,
      roomId:this.roomId,
    })
  }
  
  setRemoteStream(event:any,video) {
    console.log('hi..........................')
    console.log(video)
    this.remoteStream = event.streams[0]
    video.srcObject = this.remoteStream
    video.onloadedmetadata = ()=> {
    video.play();
  };
  let div = document.getElementById('videos')
  div?.appendChild(video)
  }
  
  sendIceCandidate(event:any,socket:any) {
    if (event.candidate) {
      this.socket.emit('webrtc_ice_candidate', {
        roomId:this.roomId,
        label: event.candidate.sdpMLineIndex,
        candidate: event.candidate.candidate,
      })
    }
  }
  
  muteUnmute():void{
    let enabled = this.localStream.getAudioTracks()[0].enabled;
    console.log(this.localStream.getAudioTracks()[0].enabled)
    if(enabled == true){
      this.localStream.getAudioTracks()[0].enabled = false;
      this.islocalmuted=true
    }else{
      this.localStream.getAudioTracks()[0].enabled = true;
      this.islocalmuted=false
    }
  }

  playStop():void{
    let enabled = this.localStream.getVideoTracks()[0].enabled;
    if(enabled){
      this.localStream.getVideoTracks()[0].enabled = false;
      this.islocalplay=false; 
    }else{
      this.localStream.getVideoTracks()[0].enabled = true;
      this.islocalplay=true;
    }
  }
  

  chat(){
    debugger;
    this.isChatOn = !this.isChatOn
    if(!this.isChatOn){
      this.videoChatContainer.nativeElement.style.width = '70%'
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer?.style.display = 'block'
    }
    else{
      this.videoChatContainer.nativeElement.style.width = '100%'
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer?.style.display = 'none' 
    }
  }
  screenshare(){
    if(!this.isScreenShared){
      console.log('not screen shared')
      navigator.mediaDevices.getDisplayMedia({video:true,audio:true}).then((stream)=>{
        this.screenShareStream = stream
        this.rtcPeerConnection.getSenders().forEach(
          (rtpSender)=> {
            if (rtpSender.track.kind == 'video') {
              rtpSender.replaceTrack(this.screenShareStream.getVideoTracks()[0]).then(()=>{
                console.log("Replaced video track from camera to screen");
                console.log('screen share replace ')
                console.log(this.localVideoComponent)
                this.localVideoComponent.nativeElement.srcObject = this.screenShareStream 
                this.isScreenShared = true
                this.screenShareStream.getVideoTracks()[0].onended = ()=> {
                  console.log('***********************************************************')
                  this.isScreenShared = true
            
                  this.screenshare()
                };
              }).catch(function(error) {
                console.log("Could not replace video track: " + error);
              });
            }
            
          }
          
         );
        
      },(err)=>{console.error('failed to Screenshare',err)})
    }
    else{
      console.log('screen shared')
      navigator.mediaDevices.getUserMedia(this.mediaConstrain).then((stream)=>{
        this.localStream = stream
        this.rtcPeerConnection.getSenders().forEach(
          (rtpSender)=> {
            if (rtpSender.track.kind == 'video') {
              rtpSender.replaceTrack(this.localStream.getVideoTracks()[0]).then(()=>{
                console.log("Replaced video track from screen to camera");
                console.log(this.localVideoComponent)
                this.localVideoComponent.nativeElement.srcObject = this.localStream 
                this.isScreenShared = false
              }).catch(function(error) {
                console.log("Could not replace video track: " + error);
              });
            }
            
          }
          
         );
        
      },(err)=>{console.error('failed to Screenshare',err)})
    }
  }

  hangup(): void {
    var audio = document.getElementById('callend-audio')
    setTimeout(() => {
      audio.play()``  
    }, 200);
    console.log('Hanging up.')
    console.log(this.roomId)
    
    this.socket.emit("hangup",this.roomId)
    this.socket.on('leave',(roomId)=>{
      this.handleRemoteHangup(roomId)
    })
    const tracks = this.localStream.getTracks();

    tracks.forEach(function(track) {
      track.stop();
    });
    
     
  }
  
  handleRemoteHangup(roomId:any): void {
    console.log('Session terminated by remote peer.')
    this.socket.close()
    this.stopPeerConnection()
    const tracks = this.localStream.getTracks();
      tracks.forEach(function(track) {
        track.stop();
    });
    this.snack.open('Call Ended. On room '+roomId, 'Dismiss', { duration: 5000 })
  }

  stopPeerConnection(): void {
    if (this.rtcPeerConnection) {
      this.rtcPeerConnection.close()
      this.rtcPeerConnection = null;
    }
    this.router.navigate(['/dashboard'])
  }

  //message
  sendMessage(message){
    if(message!='' && message!= undefined){
  
    var date = new Date()
    var date = this.datePipe.transform(date,'h:mm a')
    this.message = message
    console.log(message)
    console.log(this.roomId)
    this.socket.emit('message',message,this.roomId)
    const element = document.createElement('li');
    element.innerHTML = this.message +'&nbsp; <sub><small style="font-size:small; opacity:.65"> '+ date + '</small></sub>';//aaya aapdo message ape etle outgoing msg
    element.classList.add("myMsg");// = "myMsg";
    document.getElementById('message-list').appendChild(element);
    this.message = '';
    var items = document.querySelectorAll("li");
    var last = items[items.length-1];
    last.scrollIntoView();
    }
  }
  
  

  @HostListener('window:beforeunload')
  //ng-destroy
  ngOnDestroy(){
    this.hangup()
  }
//saru lage to k je  ene position ma to muki de ke chat button dabave to left ka right side ave ha

}
