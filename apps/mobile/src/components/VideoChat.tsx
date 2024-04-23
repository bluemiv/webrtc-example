import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        newSocket.emit('candidate', event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    newSocket.on('offer', async (offer) => {
      pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('answer', pc.localDescription);
    });

    newSocket.on('answer', (answer) => {
      pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    newSocket.on('candidate', (candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    setPeerConnection(pc);
  }, []);

  const startVideo = async () => {
    if (!localVideoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection?.addTrack(track, stream));
  };

  const call = async () => {
    const offer = await peerConnection?.createOffer();
    await peerConnection?.setLocalDescription(offer);
    socket?.emit('offer', offer);
  };

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted></video>
      <video ref={remoteVideoRef} autoPlay playsInline></video>
      <button onClick={startVideo}>Start Video</button>
      <button onClick={call}>Call</button>
    </div>
  );
};

export default VideoChat;
