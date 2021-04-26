// @ts-nocheck  
import { Component, ElementRef, OnInit, ViewChild, } from "@angular/core";
import { Router } from "@angular/router";
import { DatePipe } from '@angular/common'
import { AuthService } from "src/service/auth.service";
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-room',
  templateUrl: 'room.component.html',
  styleUrls: ['room.component.css']
})
export class RoomComponent implements OnInit {
  static localDisplayName: any

  static mediaConstrain = {
    video: { width: { max: 1280 }, height: { max: 720 }, framerate: 30, facingMode: { exact: "user" } },
    audio: { echoCancellation: true, noiseSuppression: true }
  }
  static peerConnectionConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  }
  static uid = localStorage.getItem('uid');
  static picurl;
  @ViewChild('video_chat_container') videoChatContainer: ElementRef | any;
  static localUuid: string;
  static localStream: MediaStream;
  static serverConnection: WebSocket;
  static WS_PORT = '5000';
  static peerConnections: any = [];
  static roomName: string;
  static peer;
  static peers = [];
  static numberofcameras = 0;
  roomId = RoomComponent.roomName;
  message: string = '';
  get islocalmuted() { return RoomComponent.islocalmuted };
  get isScreenShared() { return RoomComponent.isScreenShared };
  get islocalplay() { return RoomComponent.islocalplay };
  isScreenShared;
  toggled: boolean = false;
  msgbox = document.getElementById('msgbox')
  static isChatOn: boolean = false;
  static screenShareStream: MediaStream;
  static datePipe = new DatePipe('en-US');
  static unreadmessagesgcount = 0;
  static islocalmuted: boolean = false;
  static isScreenShared: boolean = false;
  static islocalplay: boolean = true;
  static baseurl;
  static user;
  handleSelection(event) {
    // console.log(event.char);
    if (this.message == undefined) { this.message = "" }
    this.message += event.char
    this.toggled = !this.toggled
  }

  constructor(private router: Router, public datePipe: DatePipe, private authservice: AuthService, public snackbar:MatSnackBar) {}

  message = RoomComponent.message
  async ngOnInit() {
    RoomComponent.baseurl= this.authservice.baseurl
    RoomComponent.uid = localStorage.getItem('uid')
    
    this.authservice.getUser(RoomComponent.uid).subscribe(res=>{
      RoomComponent.user = res
    })
    this.authservice.getProfile(RoomComponent.uid).subscribe(res => {
      RoomComponent.picurl = res
    })
    console.log(RoomComponent.uid)
    
    // var stream
    // aaaait navigator.mediaDevices.getDisplayMedia({audio:false,video:true}).then(Stream=>{
    //   RoomComponent.teststream = Stream;
    // })
    

    setTimeout(() => {
      start()
    }, 500);
    
    RoomComponent.isChatOn = false
    // console.log(RoomComponent.roomName)
  }

  get roomName() {
    return RoomComponent.roomName
  }

  get unreadmsgcount() {
    return RoomComponent.unreadmessagesgcount
  }

  handleKeyUp(e){
    if(e.keyCode === 13){
       this.sendMessage(e.srcElement.value)
    }
 }

  sendMessage(message) {
    if (message != '' && message != undefined) {
      this.message = message
      RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'SenderName': RoomComponent.localDisplayName, 'message': this.message, 'uuid': RoomComponent.localUuid, 'dest': 'all' }));
      var date = new Date()
      var date = this.datePipe.transform(date, 'h:mm a')

      const element = document.createElement('li');

      element.innerHTML = this.message + '&nbsp;<span style="float:right;margin-left:5px;"> <sub style="font-size:small; opacity:.65;"> ' + date + '</sub></span>';//aaya aapdo message ape etle outgoing msg
      element.classList.add("myMsg");// = "myMsg";
      document.getElementById('message-list').appendChild(element);
      this.message = '';
      var items = document.querySelectorAll("li");
      var last = items[items.length - 1];
      last.scrollIntoView();
      var inputfield = document.getElementById('msgbox')
      inputfield?.focus()

    }
  }

  static muteUnmute() {
    let enabled = RoomComponent.localStream.getAudioTracks()[0].enabled;
    // console.log(RoomComponent.localStream.getAudioTracks()[0].enabled)
    if (enabled == true) {
      RoomComponent.localStream.getAudioTracks()[0].enabled = false;
      this.islocalmuted = true
    } else {
      RoomComponent.localStream.getAudioTracks()[0].enabled = true;
      this.islocalmuted = false
    }
  }

  muteUnmute(): void {
    RoomComponent.muteUnmute()
  }

  playStop(): void {
    if(this.isScreenShared){
      this.snackbar.open("Stop ScreenSharing to turn on camera","ok",{duration:'6000',horizontalPosition:"start","verticalPosition":"top"})
      return
    }
    else{
      let enabled = RoomComponent.localStream.getVideoTracks()[0].enabled;
    if (enabled) {
      this.hideVideo()
      RoomComponent.islocalplay = false;
    } else {
      this.showVideo()
      RoomComponent.islocalplay = true;
    }
    }
    
  }

  showVideo(){
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'uuid': RoomComponent.localUuid, "video": "play", 'dest': 'all' }));
    var localvideo = document.getElementById("localVideo")
    localvideo?.style.display = "flex"
    var localimgdiv = document.getElementById("localimgdiv")
    localimgdiv?.style.display = "none"
    RoomComponent.localStream.getVideoTracks()[0].enabled = true;
  }

  hideVideo(){
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'uuid': RoomComponent.localUuid, "video": "stop", 'dest': 'all' }));
    var localvideo = document.getElementById("localVideo")
    localvideo?.style.display = "none"
    var localimgdiv = document.getElementById("localimgdiv")
    localimgdiv?.style.display = "flex"
    RoomComponent.localStream.getVideoTracks()[0].enabled = false;
  }

  chat() {
    RoomComponent.unreadmessagesgcount = 0
    if (!RoomComponent.isChatOn) {
      var inputfield = document.getElementById('msgbox')
      inputfield?.focus()
      this.videoChatContainer.nativeElement.style.width = '70%'
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'block'
      RoomComponent.isChatOn = !RoomComponent.isChatOn
    }
    else {
      this.videoChatContainer.nativeElement.style.width = '100%'
      var msgcontainer = document.getElementById('msg-container')
      msgcontainer.style.display = 'none'
      RoomComponent.isChatOn = !RoomComponent.isChatOn
    }
  }

  screenshare() {
    if (!RoomComponent.isScreenShared) {
      console.log('not screen shared')


      //@ts-ignore
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then((stream) => {
        RoomComponent.screenShareStream = stream
        this.snackbar.open("Warning: Your camera is turned off while ScreenSharing","ok",{duration:'6000',horizontalPosition:"start","verticalPosition":"top"})
        RoomComponent.islocalplay = false
        if(!this.islocalplay){
          RoomComponent.islocalplay = false
          this.showVideo()
        }
        
        // RoomComponent.localStream.getVideoTracks()[0].enabled = true;
        // RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'uuid': RoomComponent.localUuid, "video": "play", 'dest': 'all' }));
        // RoomComponent.islocalplay = true;
        console.log(RoomComponent.peerConnections)
        console.log(RoomComponent.peer);
        console.log(RoomComponent.peerConnections)
        for (var item in RoomComponent.peerConnections) {
          RoomComponent.peers.push(item)
          console.log(item.pc)
        }
        for (var key of RoomComponent.peers) {
          console.log(RoomComponent.peerConnections[key].pc)
          RoomComponent.peerConnections[key].pc.getSenders().forEach(
            (rtpSender) => {
              if (rtpSender.track.kind == 'video') {
                rtpSender.replaceTrack(RoomComponent.screenShareStream.getVideoTracks()[0]).then(() => {
                  console.log("Replaced video track from camera to screen");
                  console.log('screen share replace ')
                  // console.log(this.localVideoComponent)
                  var localVideo = document.getElementById('localVideo')
                  var tracks = RoomComponent.localStream.getVideoTracks()
                  tracks.forEach(function (track) {
                    track.stop();
                  });
                  localVideo.srcObject = RoomComponent.screenShareStream
                  RoomComponent.isScreenShared = true
                  RoomComponent.screenShareStream.getVideoTracks()[0].onended = () => {
                    RoomComponent.isScreenShared = true

                    this.screenshare()
                    RoomComponent.isScreenShared = false
                  };
                }).catch(function (error) {
                  console.log("Could not replace video track: " + error);
                });
              }
            }
          );
        }

      }, (err) => { console.error('failed to Screenshare', err) })
    }
    else {
      console.log('screen shared')
      var tracks = RoomComponent.screenShareStream.getTracks()
      tracks.forEach(function (track) {
        track.stop();
      });

      navigator.mediaDevices.getUserMedia(RoomComponent.mediaConstrain).then((stream) => {

        RoomComponent.localStream = stream

        if(!this.islocalplay){
          RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'uuid': RoomComponent.localUuid, "video": "stop", 'dest': 'all' }));
          var localvideo = document.getElementById("localVideo")
          localvideo?.style.display = "none"
          var localimgdiv = document.getElementById("localimgdiv")
          localimgdiv?.style.display = "flex"
          RoomComponent.localStream.getVideoTracks()[0].enabled = false;
        }

        if (stream) { RoomComponent.muteUnmute() }
        for (var item in RoomComponent.peerConnections) {
          RoomComponent.peers.push(item)
          console.log(item.pc)
        }
        for (var key of RoomComponent.peers) {
          console.log(RoomComponent.peerConnections[key].pc)
          RoomComponent.peerConnections[key].pc.getSenders().forEach(
            (rtpSender) => {
              if (rtpSender.track.kind == 'video') {
                rtpSender.replaceTrack(RoomComponent.localStream.getVideoTracks()[0]).then(() => {
                  console.log("Replaced video track from screen to camera");
                  // console.log(this.localVideoComponent)
                  var localVideo = document.getElementById('localVideo')
                  localVideo.srcObject = RoomComponent.localStream
                  RoomComponent.isScreenShared = false
                }).catch(function (error) {
                  console.log("Could not replace video track: " + error);
                });
              }

            }

          );
        }
      }, (err) => { console.error('failed to Screenshare', err) })
    }
  }

  hangup(): void {
    var audio = document.getElementById('callend-audio')
    setTimeout(() => {
      audio.play()
    }, 200);
    console.log('Hanging up.')
    console.log(this.roomName)
    console.log('peerid', RoomComponent.localUuid)
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'uuid': RoomComponent.localUuid, 'close': 'close', 'dest': 'all' }))
    // var peer = RoomComponent.peerConnections
    // console.log(RoomComponent.peer)
    // if(RoomComponent.peer){
    //   RoomComponent.peer.close()
    //   console.log(RoomComponent.peer)
    // }

    var tracks = RoomComponent.localStream.getTracks();
    if (tracks) {
      tracks.forEach(function (track) {
        track.stop();
      });
    }

    if (RoomComponent.isScreenShared) {
      var tracks = RoomComponent.screenShareStream.getTracks();
      if (tracks) {
        tracks.forEach(function (track) {
          track.stop();
        });
      }
    }

    this.router.navigate(['/dashboard'])
  }

  get isChatOn() { return RoomComponent.isChatOn }
}


async function start() {
  RoomComponent.localUuid = createUUID();
  // console.log(RoomComponent.localUuid)
  // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
  var urlParams = new URLSearchParams(window.location.search);
  RoomComponent.localDisplayName = RoomComponent.user.fname
  RoomComponent.roomName = urlParams.get('roomName') || prompt('Enter room Name', '');
  document.getElementById('localVideoContainer').appendChild(makeLabel(RoomComponent.localDisplayName + '(me)'));
  await navigator.mediaDevices.enumerateDevices()
    .then(function (devices) {
      devices.forEach(function (device) {
        if (device.kind == 'videoinput') {
      
          RoomComponent.numberofcameras = RoomComponent.numberofcameras + 1
        }
        console.log(device.kind + ": " + device.label +
          " id = " + device.deviceId);
      })
    })
    .catch(function (err) {
      console.log(err.name + ": " + err.message);
    });
  console.log(RoomComponent.numberofcameras)

  var permission = false;
  // while(permission!=true){

  // }


  navigator.permissions.query({ name: 'camera' })
    .then((permissionObj) => {
      // console.log(permissionObj.state);
    })
    .catch((error) => {
      console.log('Got error :', error);
    })
  // specify no audio for user media
  var constraints = {
    video: {
      width: { max: 320 },
      height: { max: 240 },
      frameRate: { max: 30 },
    },
    audio: false,
  };

  // set up local video stream
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(RoomComponent.mediaConstrain)
      .then(stream => {
        RoomComponent.localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
        var localdiv = document.getElementById('localVideoContainer')
        var imgdiv = document.createElement('div')
        imgdiv.id = "localimgdiv"
        imgdiv.style.display = "none"
        imgdiv.style.justifyContent = "center"
        imgdiv.style.height = "100%"
        var img = new Image
        img.src = "https://localhost:5000"+RoomComponent.picurl
        img.style.width = "250px"
        img.style.maxWidth = "100%"
        img.style.height = "250px"
        img.style.maxHeight = "100%"
        img.style.borderRadius = '50%';
        img.style.display = 'block';
        img.style.margin = 'auto';
        img.style.objectFit = 'cover'
        imgdiv.appendChild(img)
        localdiv?.appendChild(imgdiv)
        if (stream) { RoomComponent.muteUnmute() }
      }).catch(errorHandler)

      // set up websocket and message all existing clients
      .then(() => {
        console.log('wss://'+RoomComponent.baseurl.substr(7))
        RoomComponent.serverConnection = new WebSocket('wss://' + RoomComponent.baseurl.substr(7));

        RoomComponent.serverConnection.onmessage = gotMessageFromServer;
        // console.log(RoomComponent.serverConnection.onmessage)
        RoomComponent.serverConnection.onopen = event => {
          RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'displayName': RoomComponent.localDisplayName,"isplay":RoomComponent.islocalplay ,"picurl": RoomComponent.picurl, 'uuid': RoomComponent.localUuid, 'dest': 'all' }));
        }
      }).catch(errorHandler);

  } else {
    alert('Your browser does not support getUserMedia API');
  }
}

function gotMessageFromServer(message) {
  console.log(message)
  // console.log(RoomComponent.datePipe)
  var signal = JSON.parse(message.data);
  console.log(signal)
  var peerUuid = signal.uuid;
  RoomComponent.peerUUid = peerUuid
  // Ignore messages that are not for us or from ourselves
  if (peerUuid == RoomComponent.localUuid || (signal.dest != RoomComponent.localUuid && signal.dest != 'all')) return;
  if (signal.close == 'close') {
    var isHangedUp = true;
    var event = null;
    checkPeerDisconnect(event, signal.uuid, isHangedUp)
  }
  if (signal.video) {
    if (signal.video == "stop") {
      var div = document.getElementById("remoteVideo_" + peerUuid)
      div?.children[0].style.display = "flex"
      div?.children[1].style.display = "none"
    } else if (signal.video == "play") {
      var div = document.getElementById("remoteVideo_" + peerUuid)
      div?.children[0].style.display = "none"
      div?.children[1].style.display = "flex"
    }
  }

  if (signal.message) {
    const element = document.createElement('li');
    var date = RoomComponent.datePipe.transform(signal.time, 'h:mm a')
    element.innerHTML = signal.message + ' &nbsp;<span style="float:right;margin-left:5px;"><sub style="font-size:small; color:lightgrey;opacity:0.65;">' + date + '</sub><span>';
    element.classList.add("msg");
    document.getElementById('message-list').appendChild(element);
    var items = document.querySelectorAll("li");
    var last = items[items.length - 1];
    last.scrollIntoView();
    if (!RoomComponent.isChatOn) {
      RoomComponent.unreadmessagesgcount++
    }
  }
  if (signal.displayName && signal.dest == 'all') {
    // set up peer connection object for a newcomer peer
    setUpPeer(signal.isplay,signal.picurl, peerUuid, signal.displayName);
    var screensharebtn = document.getElementById('screen-share')
    console.log(screensharebtn)
    screensharebtn.style.display = 'inline-block'
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'displayName': RoomComponent.localDisplayName,"isplay":RoomComponent.islocalplay, "picurl": RoomComponent.picurl, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));

  } else if (signal.displayName && signal.dest == RoomComponent.localUuid) {
    // initiate call if we are the newcomer peer
    var screensharebtn = document.getElementById('screen-share')
    console.log(screensharebtn)
    screensharebtn.style.display = 'inline-block'
    setUpPeer(signal.isplay,signal.picurl, peerUuid, signal.displayName, true);

  } else if (signal.sdp) {
    RoomComponent.peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        RoomComponent.peerConnections[peerUuid].pc.createAnswer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
      }
    }).catch(errorHandler);

  } else if (signal.ice) {
    RoomComponent.peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  }

}

async function setUpPeer(isplay,picurl, peerUuid, displayName, initCall = false) {
  RoomComponent.peerConnections[peerUuid] = { 'roomName': RoomComponent.roomName, 'displayName': displayName, 'pc': new RTCPeerConnection(RoomComponent.peerConnectionConfig),"picurl":picurl };
  RoomComponent.peerConnections[peerUuid].pc.onicecandidate = event => gotIceCandidate(event, peerUuid);
  RoomComponent.peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid, picurl ,isplay);
  RoomComponent.peerConnections[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid, false);

  // if(RoomComponent.numberofcameras == 0){

  //   RoomComponent.peerConnections[peerUuid].pc.addStream(RoomComponent.teststream);
  // }

  if (RoomComponent.isScreenShared) {
    RoomComponent.peerConnections[peerUuid].pc.addStream(RoomComponent.screenShareStream);
  } else {
    RoomComponent.peerConnections[peerUuid].pc.addStream(RoomComponent.localStream);
  }

  // console.log(RoomComponent.peer)
  updateLayout()
  if (initCall) {
    RoomComponent.peerConnections[peerUuid].pc.createOffer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
  }
}

function gotIceCandidate(event, peerUuid) {
  if (event.candidate != null) {
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'ice': event.candidate, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));
  }
}

function createdDescription(description, peerUuid) {
  // console.log(`got description, peer ${peerUuid}`);
  RoomComponent.peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
    RoomComponent.serverConnection.send(JSON.stringify({ 'roomName': RoomComponent.roomName, 'sdp': RoomComponent.peerConnections[peerUuid].pc.localDescription, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));
  }).catch(errorHandler);
}

var count = 0
function gotRemoteStream(event, peerUuid, picurl, isplay) {
  // debugger
  if (count > 0) {
    count = 0; return
  }

  if (count == 0) {
    // console.log(`got remote stream, peer ${peerUuid}`);
    //assign stream to new HTML video element
    var vidElement = document.createElement('video');
    vidElement.setAttribute('autoplay', '');
    vidElement.setAttribute('muted', '');
    vidElement.setAttribute('id', 'remote-video')
    vidElement.srcObject = event.streams[0];

    var vidContainer = document.createElement('div');
    vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
    var imgdiv = document.createElement('div')
    imgdiv.id = "remoteimgdiv"
    if(isplay==true)
    {imgdiv.style.display = "none"}
    else
    {imgdiv.style.display = "flex"}
    imgdiv.style.justifyContent = "center"
    imgdiv.style.height = "100%"
    var img = new Image
    img.src = "https://localhost:5000"+picurl
    img.style.width = "250px"
    img.style.maxWidth = "100%"
    img.style.height = "250px"
    img.style.maxHeight = "100%"
    img.style.borderRadius = '50%';
    img.style.display = 'block';
    img.style.margin = 'auto';
    img.style.objectFit = 'cover'
    imgdiv.appendChild(img)
    vidContainer?.appendChild(imgdiv)
    vidContainer.setAttribute('class', 'videoContainer');
    // var img =document.createElement('img')
    // img.src= RoomComponent.picurl
    // vidContainer.appendChild(img)
    vidContainer.appendChild(vidElement);
    vidContainer.appendChild(makeLabel(RoomComponent.peerConnections[peerUuid].displayName));

    document.getElementById('videos').appendChild(vidContainer);

    updateLayout();
  }
  count++
}

function checkPeerDisconnect(event, peerUuid, isHangedUp) {
  console.log(peerUuid)
  console.log(RoomComponent.peerConnections)
  var state;

  if (isHangedUp == true) {
    RoomComponent.peerConnections[peerUuid].pc.close()
    state = RoomComponent.peerConnections[peerUuid].pc.iceConnectionState;
    console.log(peerUuid)
    delete RoomComponent.peerConnections[peerUuid];
    document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
    updateLayout();
  }
  else {
    state = RoomComponent.peerConnections[peerUuid].pc.iceConnectionState;
    if (state === "failed" || state === "closed" || state === "disconnected") {
      console.log(peerUuid)
      delete RoomComponent.peerConnections[peerUuid];
      document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
      updateLayout();
    }
  }
  console.log(`connection with peer ${peerUuid} ${state}`);
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos
  // var rowHeight = '98vh';
  // var colWidth = '98vw';

  var numVideos = Object.keys(RoomComponent.peerConnections).length + 1; // add one to include local video
  console.log("number of videos is ..", numVideos)

  switch (numVideos) {
    case 1: {
      var videosdiv = document.getElementById('videos')
      videosdiv?.style.removeProperty('position')

      var localVideoContainer = document.getElementById('localVideoContainer')
      localVideoContainer?.removeAttribute('class');
      localVideoContainer?.classList.add('videoContainer');
      break;
    }

    case 2: {
      console.log('test 2');
      var videosdiv = document.getElementById('videos')
      videosdiv?.style.position = "relative";
      setTimeout(() => {
        var localVideoContainer = document.getElementById('localVideoContainer')
        localVideoContainer?.removeAttribute('class');//pan e class aya remove to thavo jove ne wait
        localVideoContainer.classList.add('videoContainer');
        localVideoContainer.classList.add('class-2');

        var videosdiv = document.getElementById('videos')
        videosdiv?.children[1].removeAttribute('class');
        videosdiv?.children[1].classList.add('videoContainer')
      }, 500);
      break;
    }

    case 3: {

      console.log('test 3');
      // add btn control bottom 4%

      console.log(new Date())
      setTimeout(() => {
        console.log(new Date())

        var videosdiv = document.getElementById('videos')
        videosdiv?.style.position = "relative";

        var localVideoContainer = document.getElementById('localVideoContainer')
        localVideoContainer?.removeAttribute('class');
        localVideoContainer.classList.add('videoContainer');
        localVideoContainer.classList.add('class-3-localvideo');

        videosdiv?.children[1].removeAttribute('class');
        videosdiv?.children[1].classList.add('videoContainer')
        videosdiv?.children[1].classList.add('class-3-secondvideo')
        videosdiv?.children[2].removeAttribute('class')
        videosdiv?.children[2].classList.add('videoContainer')
        videosdiv?.children[2].classList.add('class-3-thirdvideo')

        var btn = document.getElementById('btn-control')
        console.log(btn)
        btn.classList.add('class-3-btn')


      }, 4000);
      break;
    }

    case 4: {
      console.log('test 4');

      setTimeout(() => {
        var videosdiv = document.getElementById('videos')
        videosdiv?.style.position = "relative";

        var localVideoContainer = document.getElementById('localVideoContainer')
        localVideoContainer.classList.add('class-3-localvideo');

        videosdiv?.children[2].classList.remove('class-3-remotevideo')
        videosdiv?.children[2].classList.add('class-4-thirdvideo')
        videosdiv?.children[3].classList.add('class-4-fourthvideo')
        videosdiv?.children[3].classList.add('videoContainer')

        var btn = document.getElementById('btn-control')
        console.log(btn)
        btn.classList.remove('class-3-btn')
        btn.classList.add('btn-control')

      }, 4000);

      break;
    }

    case 5: {
      console.log('test 5');
      break;
    }

    case 6: {
      console.log('test 6');
      break;
    }

    case 7: {
      console.log('test 7');
      break;
    }

    default: {
      console.log('test default');
      break;
    }
  }
  // if (numVideos > 1 && numVideos <= 4) { // 2x2 grid
  //   rowHeight = '48vh';
  //   colWidth = '48vw';
  // } else if (numVideos > 4) { // 3x3 grid
  //   rowHeight = '32vh';
  //   colWidth = '32vw';
  // }

  // document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
  // document.documentElement.style.setProperty(`--colWidth`, colWidth);
}

function makeLabel(label) {
  var vidLabel = document.createElement('div');
  vidLabel.appendChild(document.createTextNode(label));
  vidLabel.setAttribute('class', 'videoLabel');
  return vidLabel;
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

