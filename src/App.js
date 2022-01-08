import React from "react";

export class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      'pc1Local': null,
      'pc1Remote': null,
      offerOptions: {
        'offerToReceiveAudio': 1,
        'offerToReceiveVideo': 1
      },
      button: {
        'start': true,
        'call': false,
        'end': false
      },
      video: {
        'srcHost': null,
        'srcGuest': null
      }
    };
    this.start = this.start.bind(this);
    this.call = this.call.bind(this);
    this.end = this.end.bind(this);
  }

  gotStream(stream) {
    console.log('Received local stream');
    //video1.srcObject = stream;
    this.setState({video: {'srcHost': stream}});
    window.localStream = stream;
    // callButton.disabled = false;
    this.setState({button: {'call': true}});
  }
  
  start() {
    console.log('Requesting local stream');
    // startButton.disabled = true;
    this.setState({button: {'start': false}});
    navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true
        })
        // .then(gotStream)
        .then(this.gotStream)
        .catch(e => console.log('getUserMedia() error: ', e));
  }
  
  call() {
    // callButton.disabled = true;
    this.setState({button: {'call': false}});
    // hangupButton.disabled = false;
    this.setState({button: {'end': true}});
    console.log('Starting calls');
    const audioTracks = window.localStream.getAudioTracks();
    const videoTracks = window.localStream.getVideoTracks();
    if (audioTracks.length > 0) {
      console.log(`Using audio device: ${audioTracks[0].label}`);
    }
    if (videoTracks.length > 0) {
      console.log(`Using video device: ${videoTracks[0].label}`);
    }
    // Create an RTCPeerConnection via the polyfill.
    const servers = null;
    // pc1Local = new RTCPeerConnection(servers);
    const pc1Local = new RTCPeerConnection(servers);
    // pc1Remote = new RTCPeerConnection(servers);
    const pc1Remote = new RTCPeerConnection(servers);
    // pc1Remote.ontrack = gotRemoteStream1;
    pc1Remote.ontrack = this.gotRemoteStream1;
    // pc1Local.onicecandidate = iceCallback1Local;
    pc1Local.onicecandidate = this.iceCallback1Local;
    // pc1Remote.onicecandidate = iceCallback1Remote;
    pc1Remote.onicecandidate = this.iceCallback1Remote;
    console.log('pc1: created local and remote peer connection objects');
  
    window.localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
    console.log('Adding local stream to pc1Local');
    pc1Local
        // .createOffer(offerOptions)
        .createOffer(this.state.offerOptions)
        // .then(gotDescription1Local, onCreateSessionDescriptionError);
        .then(this.gotDescription1Local, this.onCreateSessionDescriptionError);
  
    this.setState({'pc1Local': pc1Local, 'pc1Remote': pc1Remote});
  }
  
  onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
  
  gotDescription1Local(desc) {
    const pc1Local = this.state['pc1Local'];
    pc1Local.setLocalDescription(desc);
    console.log(`Offer from pc1Local\n${desc.sdp}`);
    const pc1Remote = this.state['pc1Remote'];
    pc1Remote.setRemoteDescription(desc);
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    // pc1Remote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
    pc1Remote.createAnswer().then(this.gotDescription1Remote, this.onCreateSessionDescriptionError);
    this.setState({'pc1Local': pc1Local, 'pc1Remote': pc1Remote});
  }
  
  gotDescription1Remote(desc) {
    const pc1Remote = this.state['pc1Remote'];
    pc1Remote.setLocalDescription(desc);
    console.log(`Answer from pc1Remote\n${desc.sdp}`);
    const pc1Local = this.state['pc1Local'];
    pc1Local.setRemoteDescription(desc);
    this.setState({'pc1Local': pc1Local, 'pc1Remote': pc1Remote});
  }
 
  end() {
    console.log('Ending calls');
    const pc1Local = this.state['pc1Local'];
    const pc1Remote = this.state['pc1Remote'];
    pc1Local.close();
    pc1Remote.close();
    // pc1Local = pc1Remote = null;
    this.setState({
      'pc1Local': pc1Local, 
      'pc1Remote': pc1Remote
    });
    // hangupButton.disabled = true;
    this.setState({button: {'end': false}});
    // callButton.disabled = false;
    this.setState({button: {'call': true}});
  }
  
  gotRemoteStream1(e) {
    // if (video2.srcObject !== e.streams[0]) {
    if(this.state.video['srcGuest'] !== e.streams[0]){
      // video2.srcObject = e.streams[0];
      this.setState({video: {'srcGuest': e.streams[0]}});
      console.log('pc1: received remote stream');
    }
  }
  
  iceCallback1Local(event) {
    // handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
    this.handleCandidate(event.candidate, this.state['pc1Remote'], 'pc1: ', 'local');
  }
  
  iceCallback1Remote(event) {
    // handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
    this.handleCandidate(event.candidate, this.state['pc1Local'], 'pc1: ', 'remote');
  }
  
  handleCandidate(candidate, dest, prefix, type) {
    dest.addIceCandidate(candidate)
        // .then(onAddIceCandidateSuccess, onAddIceCandidateError);
        .then(this.onAddIceCandidateSuccess, this.onAddIceCandidateError);
    console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
  }
  
  onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
  }
  
  onAddIceCandidateError(error) {
    console.log(`Failed to add ICE candidate: ${error.toString()}`);
  }

  makeButtons(){
    return (
      <div id='buttonGroup'>
        <button id='start' onClick={this.start} disabled={!this.state.button['start']}>Start</button>
        <button id='call' onClick={this.call} disabled={!this.state.button['call']}>Call</button>
        <button id='end' onClick={this.end} disabled={!this.state.button['end']}>End</button>
      </div>
    );
  }

  makeVideos(){
    return (
      <div>
        <video id='host' width='500px' height='300px' controls>
          <source src={this.state.video['srcHost']} />
          No host video
        </video>
        <video id='guest' width='500px' height='300px'>
          <source  src={this.state.video['srcGuest']} />
          No guest video
          </video>
      </div>
    );
  }

  render(){
    return (
      <div id='app'>
        <h1>Welcome to my RTC React App</h1>
        {this.makeButtons()}
        {this.makeVideos()}
      </div>
    );
  }
}

/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/*
'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

const video1 = document.querySelector('video#video1');
const video2 = document.querySelector('video#video2');
const video3 = document.querySelector('video#video3');

let pc1Local;
let pc1Remote;
let pc2Local;
let pc2Remote;
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

function gotStream(stream) {
  console.log('Received local stream');
  video1.srcObject = stream;
  window.localStream = stream;
  callButton.disabled = false;
}

function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true
      })
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ', e));
}

function call() {
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting calls');
  const audioTracks = window.localStream.getAudioTracks();
  const videoTracks = window.localStream.getVideoTracks();
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  // Create an RTCPeerConnection via the polyfill.
  const servers = null;
  pc1Local = new RTCPeerConnection(servers);
  pc1Remote = new RTCPeerConnection(servers);
  pc1Remote.ontrack = gotRemoteStream1;
  pc1Local.onicecandidate = iceCallback1Local;
  pc1Remote.onicecandidate = iceCallback1Remote;
  console.log('pc1: created local and remote peer connection objects');

  pc2Local = new RTCPeerConnection(servers);
  pc2Remote = new RTCPeerConnection(servers);
  pc2Remote.ontrack = gotRemoteStream2;
  pc2Local.onicecandidate = iceCallback2Local;
  pc2Remote.onicecandidate = iceCallback2Remote;
  console.log('pc2: created local and remote peer connection objects');

  window.localStream.getTracks().forEach(track => pc1Local.addTrack(track, window.localStream));
  console.log('Adding local stream to pc1Local');
  pc1Local
      .createOffer(offerOptions)
      .then(gotDescription1Local, onCreateSessionDescriptionError);

  window.localStream.getTracks().forEach(track => pc2Local.addTrack(track, window.localStream));
  console.log('Adding local stream to pc2Local');
  pc2Local.createOffer(offerOptions)
      .then(gotDescription2Local, onCreateSessionDescriptionError);
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

function gotDescription1Local(desc) {
  pc1Local.setLocalDescription(desc);
  console.log(`Offer from pc1Local\n${desc.sdp}`);
  pc1Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc1Remote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
}

function gotDescription1Remote(desc) {
  pc1Remote.setLocalDescription(desc);
  console.log(`Answer from pc1Remote\n${desc.sdp}`);
  pc1Local.setRemoteDescription(desc);
}

function gotDescription2Local(desc) {
  pc2Local.setLocalDescription(desc);
  console.log(`Offer from pc2Local\n${desc.sdp}`);
  pc2Remote.setRemoteDescription(desc);
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2Remote.createAnswer().then(gotDescription2Remote, onCreateSessionDescriptionError);
}

function gotDescription2Remote(desc) {
  pc2Remote.setLocalDescription(desc);
  console.log(`Answer from pc2Remote\n${desc.sdp}`);
  pc2Local.setRemoteDescription(desc);
}

function hangup() {
  console.log('Ending calls');
  pc1Local.close();
  pc1Remote.close();
  pc2Local.close();
  pc2Remote.close();
  pc1Local = pc1Remote = null;
  pc2Local = pc2Remote = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}

function gotRemoteStream1(e) {
  if (video2.srcObject !== e.streams[0]) {
    video2.srcObject = e.streams[0];
    console.log('pc1: received remote stream');
  }
}

function gotRemoteStream2(e) {
  if (video3.srcObject !== e.streams[0]) {
    video3.srcObject = e.streams[0];
    console.log('pc2: received remote stream');
  }
}

function iceCallback1Local(event) {
  handleCandidate(event.candidate, pc1Remote, 'pc1: ', 'local');
}

function iceCallback1Remote(event) {
  handleCandidate(event.candidate, pc1Local, 'pc1: ', 'remote');
}

function iceCallback2Local(event) {
  handleCandidate(event.candidate, pc2Remote, 'pc2: ', 'local');
}

function iceCallback2Remote(event) {
  handleCandidate(event.candidate, pc2Local, 'pc2: ', 'remote');
}

function handleCandidate(candidate, dest, prefix, type) {
  dest.addIceCandidate(candidate)
      .then(onAddIceCandidateSuccess, onAddIceCandidateError);
  console.log(`${prefix}New ${type} ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add ICE candidate: ${error.toString()}`);
}
*/