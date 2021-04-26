
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import {Socket} from 'ngx-socket-io';
import { io } from "socket.io-client";

@Component({
    selector: 'app-room',
    templateUrl: 'room.component.html',
    styleUrls: ['room.component.css']
})
export class RoomComponent implements OnInit {

  @ViewChild('videogrid') videogrid: ElementRef|any;
  //@ts-ignore
  
  myvideostream:MediaStream | null | undefined;
  currentuserid:any;
  peers = {};
  ROOM_ID=1;
  // videoGrid = document.getElementById('video-grid')
  myvideo=document.createElement("video")

  url: string='ws://192.168.43.119:5000'
  connections = {}
  const peerConnectionConfig = {
	'iceServers': [
		// { 'urls': 'stun:stun.services.mozilla.com' },
		{ 'urls': 'stun:stun.l.google.com:19302' },
	]
  }
  socket = null
  socketId = null
  elms = 0

  constructor() { 
    this.videoAvailable = false
		this.audioAvailable = false

		this.state = {
			video: false,
			audio: false,
			screen: false,
			showModal: false,
			screenAvailable: false,
			messages: [],
			message: "",
			newmessages: 0,
			askForUsername: true,
			username: 'jenish',
		}
		connections = {}
    this.getPermissions()
  }

    //@ts-ignore
    peer = new Peer({
      path:'/peerjs',
      host:'/',
      port:5000,
      debug:3
    })

  
  async ngOnInit() {
    
  }

  async ngAfterViewInit(){}

}

getPermissions = async () => {
  try{
    await navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => this.videoAvailable = true)
      .catch(() => this.videoAvailable = false)

    await navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => this.audioAvailable = true)
      .catch(() => this.audioAvailable = false)

    if (navigator.mediaDevices.getDisplayMedia) {
      this.setState({ screenAvailable: true })
    } else {
      this.setState({ screenAvailable: false })
    }

    if (this.videoAvailable || this.audioAvailable) {
      navigator.mediaDevices.getUserMedia({ video: this.videoAvailable, audio: this.audioAvailable })
        .then((stream) => {
          window.localStream = stream
          this.localVideoref.current.srcObject = stream
        })
        .then((stream) => {})
        .catch((e) => console.log(e))
    }
  } catch(e) { console.log(e) }
}

getMedia = () => {
  this.setState({
    video: this.videoAvailable,
    audio: this.audioAvailable
  }, () => {
    this.getUserMedia()
    this.connectToSocketServer()
  })
}

getUserMedia = () => {
  if ((this.state.video && this.videoAvailable) || (this.state.audio && this.audioAvailable)) {
    navigator.mediaDevices.getUserMedia({ video: this.state.video, audio: this.state.audio })
      .then(this.getUserMediaSuccess)
      .then((stream) => {})
      .catch((e) => console.log(e))
  } else {
    try {
      let tracks = this.localVideoref.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    } catch (e) {}
  }
}

getUserMediaSuccess = (stream) => {
  try {
    window.localStream.getTracks().forEach(track => track.stop())
  } catch(e) { console.log(e) }

  window.localStream = stream
  this.localVideoref.current.srcObject = stream

  for (let id in connections) {
    if (id === socketId) continue

    connections[id].addStream(window.localStream)

    connections[id].createOffer().then((description) => {
      connections[id].setLocalDescription(description)
        .then(() => {
          socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
        })
        .catch(e => console.log(e))
    })
  }

  stream.getTracks().forEach(track => track.onended = () => {
    this.setState({
      video: false,
      audio: false,
    }, () => {
      try {
        let tracks = this.localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch(e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
      window.localStream = blackSilence()
      this.localVideoref.current.srcObject = window.localStream

      for (let id in connections) {
        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
            })
            .catch(e => console.log(e))
        })
      }
    })
  })
}

getDislayMedia = () => {
  if (this.state.screen) {
    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(this.getDislayMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e))
    }
  }
}

getDislayMediaSuccess = (stream) => {
  try {
    window.localStream.getTracks().forEach(track => track.stop())
  } catch(e) { console.log(e) }

  window.localStream = stream
  this.localVideoref.current.srcObject = stream

  for (let id in connections) {
    if (id === socketId) continue

    connections[id].addStream(window.localStream)

    connections[id].createOffer().then((description) => {
      connections[id].setLocalDescription(description)
        .then(() => {
          socket.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
        })
        .catch(e => console.log(e))
    })
  }
  stream.getTracks().forEach(track => track.onended = () => {
    this.setState({
      screen: false,
    }, () => {
      try {
        let tracks = this.localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch(e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
      window.localStream = blackSilence()
      this.localVideoref.current.srcObject = window.localStream

      this.getUserMedia()
    })
  })
}

gotMessageFromServer = (fromId, message) => {
  var signal = JSON.parse(message)

  if (fromId !== socketId) {
    if (signal.sdp) {
      connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        if (signal.sdp.type === 'offer') {
          connections[fromId].createAnswer().then((description) => {
            connections[fromId].setLocalDescription(description).then(() => {
              socket.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
            }).catch(e => console.log(e))
          }).catch(e => console.log(e))
        }
      }).catch(e => console.log(e))
    }

    if (signal.ice) {
      connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
    }
  }
}

changeCssVideos = (main) => {
  let widthMain = main.offsetWidth
  let minWidth = "30%"
  if ((widthMain * 30 / 100) < 300) {
    minWidth = "300px"
  }
  let minHeight = "40%"

  let height = String(100 / elms) + "%"
  let width = ""
  if(elms === 0 || elms === 1) {
    width = "100%"
    height = "100%"
  } else if (elms === 2) {
    width = "45%"
    height = "100%"
  } else if (elms === 3 || elms === 4) {
    width = "35%"
    height = "50%"
  } else {
    width = String(100 / elms) + "%"
  }

  let videos = main.querySelectorAll("video")
  for (let a = 0; a < videos.length; ++a) {
    videos[a].style.minWidth = minWidth
    videos[a].style.minHeight = minHeight
    videos[a].style.setProperty("width", width)
    videos[a].style.setProperty("height", height)
  }

  return {minWidth, minHeight, width, height}
}

connectToSocketServer = () => {
  socket = io.connect(server_url, { secure: true })

  socket.on('signal', this.gotMessageFromServer)

  socket.on('connect', () => {
    socket.emit('join-call', window.location.href)
    socketId = socket.id

    socket.on('chat-message', this.addMessage)

    socket.on('user-left', (id) => {
      let video = document.querySelector(`[data-socket="${id}"]`)
      if (video !== null) {
        elms--
        video.parentNode.removeChild(video)

        let main = document.getElementById('main')
        this.changeCssVideos(main)
      }
    })

    socket.on('user-joined', (id, clients) => {
      clients.forEach((socketListId) => {
        connections[socketListId] = new RTCPeerConnection(peerConnectionConfig)
        // Wait for their ice candidate       
        connections[socketListId].onicecandidate = function (event) {
          if (event.candidate != null) {
            socket.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
          }
        }

        // Wait for their video stream
        connections[socketListId].onaddstream = (event) => {
          // TODO mute button, full screen button
          var searchVidep = document.querySelector(`[data-socket="${socketListId}"]`)
          if (searchVidep !== null) { // if i don't do this check it make an empyt square
            searchVidep.srcObject = event.stream
          } else {
            elms = clients.length
            let main = document.getElementById('main')
            let cssMesure = this.changeCssVideos(main)

            let video = document.createElement('video')

            let css = {minWidth: cssMesure.minWidth, minHeight: cssMesure.minHeight, maxHeight: "100%", margin: "10px",
              borderStyle: "solid", borderColor: "#bdbdbd", objectFit: "fill"}
            for(let i in css) video.style[i] = css[i]

            video.style.setProperty("width", cssMesure.width)
            video.style.setProperty("height", cssMesure.height)
            video.setAttribute('data-socket', socketListId)
            video.srcObject = event.stream
            video.autoplay = true
            video.playsinline = true

            main.appendChild(video)
          }
        }

        // Add the local video stream
        if (window.localStream !== undefined && window.localStream !== null) {
          connections[socketListId].addStream(window.localStream)
        } else {
          let blackSilence = (...args) => new MediaStream([this.black(...args), this.silence()])
          window.localStream = blackSilence()
          connections[socketListId].addStream(window.localStream)
        }
      })

      if (id === socketId) {
        for (let id2 in connections) {
          if (id2 === socketId) continue
          
          try {
            connections[id2].addStream(window.localStream)
          } catch(e) {}
    
          connections[id2].createOffer().then((description) => {
            connections[id2].setLocalDescription(description)
              .then(() => {
                socket.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
              })
              .catch(e => console.log(e))
          })
        }
      }
    })
  })
}
