//@ts-nocheck  
import { Component, OnInit,} from "@angular/core";


@Component({
    selector: 'app-room',
    templateUrl: 'room.component.html',
    styleUrls: ['room.component.css']
})
export class RoomComponent implements OnInit  {
  static localDisplayName:any
  
  mediaConstrain = {
    video:{width:{max:1920, ideal:1280, min:1024},height:{max:1080, ideal:720, min:576},facingMode: { exact: "user" }},
    audio:{echoCancellation: true,noiseSuppression: true}
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
  static localUuid: string;
  static localStream: MediaStream;
  static serverConnection: WebSocket;
  static WS_PORT= '5000';
  static peerConnections: any= {};
  static roomName: string | null;
  constructor() { 
    
  }

    
  async ngOnInit() {
    start()
  }

}


function start() {
  RoomComponent.localUuid = createUUID();

  // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
  var urlParams = new URLSearchParams(window.location.search);
  RoomComponent.localDisplayName = urlParams.get('displayName') || prompt('Enter your name', '');
  RoomComponent.roomName = urlParams.get('roomName') || prompt('Enter room Name', '');
  document.getElementById('localVideoContainer').appendChild(makeLabel(RoomComponent.localDisplayName));

  // specify no audio for user media
  var constraints = {
    video: {
      width: {max: 320},
      height: {max: 240},
      frameRate: {max: 30},
    },
    audio: false,
  };

  // set up local video stream
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        RoomComponent.localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
      }).catch(errorHandler)

      // set up websocket and message all existing clients
      .then(() => {
        RoomComponent.serverConnection = new WebSocket('wss://' + window.location.hostname + ':' + RoomComponent.WS_PORT);
        
        RoomComponent.serverConnection.onmessage = gotMessageFromServer;
        console.log(RoomComponent.serverConnection.onmessage)
        RoomComponent.serverConnection.onopen = event => {
          RoomComponent.serverConnection.send(JSON.stringify({'roomName':RoomComponent.roomName, 'displayName': RoomComponent.localDisplayName, 'uuid': RoomComponent.localUuid, 'dest': 'all' }));
        }
      }).catch(errorHandler);

  } else {
    alert('Your browser does not support getUserMedia API');
  }
}

function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);
  var peerUuid = signal.uuid;

  // Ignore messages that are not for us or from ourselves
  if (peerUuid == RoomComponent.localUuid || (signal.dest != RoomComponent.localUuid && signal.dest != 'all')) return;

  if (signal.displayName && signal.dest == 'all') {
    // set up peer connection object for a newcomer peer
    setUpPeer(peerUuid, signal.displayName);
    RoomComponent.serverConnection.send(JSON.stringify({'roomName':RoomComponent.roomName, 'displayName': RoomComponent.localDisplayName, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));

  } else if (signal.displayName && signal.dest == RoomComponent.localUuid) {
    // initiate call if we are the newcomer peer
    setUpPeer(peerUuid, signal.displayName, true);

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

function setUpPeer(peerUuid, displayName, initCall = false) {
  RoomComponent.peerConnections[peerUuid] = {'roomName':RoomComponent.roomName, 'displayName': displayName, 'pc': new RTCPeerConnection(RoomComponent.peerConnectionConfig) };
  RoomComponent.peerConnections[peerUuid].pc.onicecandidate = event => gotIceCandidate(event, peerUuid);
  RoomComponent.peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
  RoomComponent.peerConnections[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid);
  RoomComponent.peerConnections[peerUuid].pc.addStream(RoomComponent.localStream);

  if (initCall) {
    RoomComponent.peerConnections[peerUuid].pc.createOffer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
  }
}

function gotIceCandidate(event, peerUuid) {
  if (event.candidate != null) {
    RoomComponent.serverConnection.send(JSON.stringify({'roomName':RoomComponent.roomName, 'ice': event.candidate, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));
  }
}

function createdDescription(description, peerUuid) {
  console.log(`got description, peer ${peerUuid}`);
  RoomComponent.peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
    RoomComponent.serverConnection.send(JSON.stringify({'roomName':RoomComponent.roomName, 'sdp': RoomComponent.peerConnections[peerUuid].pc.localDescription, 'uuid': RoomComponent.localUuid, 'dest': peerUuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event, peerUuid) {
  console.log(`got remote stream, peer ${peerUuid}`);
  //assign stream to new HTML video element
  var vidElement = document.createElement('video');
  vidElement.setAttribute('autoplay', '');
  vidElement.setAttribute('muted', '');
  vidElement.srcObject = event.streams[0];

  var vidContainer = document.createElement('div');
  vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
  vidContainer.setAttribute('class', 'videoContainer');
  vidContainer.appendChild(vidElement);
  vidContainer.appendChild(makeLabel(RoomComponent.peerConnections[peerUuid].displayName));

  document.getElementById('videos').appendChild(vidContainer);

  updateLayout();
}

function checkPeerDisconnect(event, peerUuid) {
  var state = RoomComponent.peerConnections[peerUuid].pc.iceConnectionState;
  console.log(`connection with peer ${peerUuid} ${state}`);
  if (state === "failed" || state === "closed" || state === "disconnected") {
    delete RoomComponent.peerConnections[peerUuid];
    document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
    updateLayout();
  }
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos
  var rowHeight = '98vh';
  var colWidth = '98vw';

  var numVideos = Object.keys(RoomComponent.peerConnections).length + 1; // add one to include local video

  if (numVideos > 1 && numVideos <= 4) { // 2x2 grid
    rowHeight = '48vh';
    colWidth = '48vw';
  } else if (numVideos > 4) { // 3x3 grid
    rowHeight = '32vh';
    colWidth = '32vw';
  }

  document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
  document.documentElement.style.setProperty(`--colWidth`, colWidth);
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
