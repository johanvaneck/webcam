import React from 'react';
import Webcam from 'react-webcam';

export class MyWebCam extends React.Component{
    render(){
        return (
        <div>
            <h1>Welcome to my webcam!</h1>
            <p>The webcam should show below this.</p>
            <Webcam />;
            <p>The webcam should show above this.</p> 
        </div>
        );
    }
}