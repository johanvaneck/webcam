import React from "react";

export class App extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      'pcLocal': null,
      'pcRemote': null,
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

    this.gotStream = this.gotStream.bind(this);
    this.gotDescription1Local = this.gotDescription1Local.bind(this);
    this.gotDescription1Remote = this.gotDescription1Remote.bind(this);
    this.gotRemoteStream1 = this.gotRemoteStream1.bind(this);
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
    // pcLocal = new RTCPeerConnection(servers);
    const pcLocal = new RTCPeerConnection(servers);
    // pcRemote = new RTCPeerConnection(servers);
    const pcRemote = new RTCPeerConnection(servers);
    // pcRemote.ontrack = gotRemoteStream1;
    pcRemote.ontrack = this.gotRemoteStream1;
    // pcLocal.onicecandidate = iceCallback1Local;
    pcLocal.onicecandidate = this.iceCallback1Local;
    // pcRemote.onicecandidate = iceCallback1Remote;
    pcRemote.onicecandidate = this.iceCallback1Remote;
    console.log('pc: created local and remote peer connection objects');
  
    window.localStream.getTracks().forEach(track => pcLocal.addTrack(track, window.localStream));
    console.log('Adding local stream to pcLocal');
    pcLocal
        // .createOffer(offerOptions)
        .createOffer(this.state.offerOptions)
        // .then(gotDescription1Local, onCreateSessionDescriptionError);
        .then(this.gotDescription1Local, this.onCreateSessionDescriptionError);
  
    this.setState({'pcLocal': pcLocal, 'pcRemote': pcRemote});
  }
  
  onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }
  
  gotDescription1Local(desc) {
    const pcLocal = this.state['pcLocal'];
    pcLocal.setLocalDescription(desc);
    console.log(`Offer from pcLocal\n${desc.sdp}`);
    const pcRemote = this.state['pcRemote'];
    pcRemote.setRemoteDescription(desc);
    // Since the 'remote' side has no media stream we need
    // to pass in the right constraints in order for it to
    // accept the incoming offer of audio and video.
    // pcRemote.createAnswer().then(gotDescription1Remote, onCreateSessionDescriptionError);
    pcRemote.createAnswer().then(this.gotDescription1Remote, this.onCreateSessionDescriptionError);
    this.setState({'pcLocal': pcLocal, 'pcRemote': pcRemote});
  }
  
  gotDescription1Remote(desc) {
    const pcRemote = this.state['pcRemote'];
    pcRemote.setLocalDescription(desc);
    console.log(`Answer from pcRemote\n${desc.sdp}`);
    const pcLocal = this.state['pcLocal'];
    pcLocal.setRemoteDescription(desc);
    this.setState({'pcLocal': pcLocal, 'pcRemote': pcRemote});
  }
 
  end() {
    console.log('Ending calls');
    const pcLocal = this.state['pcLocal'];
    const pcRemote = this.state['pcRemote'];
    pcLocal.close();
    pcRemote.close();
    // pcLocal = pcRemote = null;
    this.setState({
      'pcLocal': pcLocal, 
      'pcRemote': pcRemote
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
      console.log('pc: received remote stream');
    }
  }
  
  iceCallback1Local(event) {
    // handleCandidate(event.candidate, pcRemote, 'pc: ', 'local');
    this.handleCandidate(event.candidate, this.state['pcRemote'], 'pc: ', 'local');
  }
  
  iceCallback1Remote(event) {
    // handleCandidate(event.candidate, pcLocal, 'pc: ', 'remote');
    this.handleCandidate(event.candidate, this.state['pcLocal'], 'pc: ', 'remote');
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
        <video id='host' playsInline={true} autoPlay={true}>
          <source src={this.state.video['srcHost']} />
          No host video
        </video>
        <video id='guest' playsInline={true} autoPlay={true}>
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

export default App;