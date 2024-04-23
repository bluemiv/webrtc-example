import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isStartedVideo, setIsStartedVideo] = useState<boolean>(false);
  const [room, setRoom] = useState<string>('test_room');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

  useEffect(() => {
    const nextSocket = io('http://192.168.11.9:5000');
    setSocket(nextSocket);

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      nextSocket.emit('candidate', { candidate: event.candidate, room });
    };

    pc.ontrack = (event) => {
      if (!remoteVideoRef.current || !event.streams[0]) return;
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    nextSocket.on('offer', async (msg) => {
      if (msg.sender === socket?.id) return;

      await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      nextSocket.emit('answer', { sdp: pc.localDescription, room });
    });

    nextSocket.on('answer', (msg) => {
      if (msg.sender === socket?.id) return;
      pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
    });

    nextSocket.on('candidate', (msg) => {
      if (msg.sender === socket?.id) return;
      console.log(msg.candidate);
      pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
    });

    setPeerConnection(pc);
  }, []);

  const startVideo = async () => {
    if (!localVideoRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection?.addTrack(track, stream));
    setIsStartedVideo(true);
  };

  const joinRoom = () => {
    if (!socket || !room) return;
    socket.emit('join', { room });
  };

  const call = async () => {
    const offer = await peerConnection?.createOffer();
    await peerConnection?.setLocalDescription(offer);
    socket?.emit('offer', { sdp: offer, room });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2">
        <div className="flex flex-col items-center">
          <div className="font-semibold">내 화면</div>
          <video ref={localVideoRef} autoPlay playsInline muted></video>
        </div>
        <div className="flex flex-col items-center">
          <div className="font-semibold">상대 화면</div>
          <video ref={remoteVideoRef} autoPlay playsInline></video>
        </div>
      </div>
      <div className="text-center font-semibold">Room Name: {room}</div>
      <div className="justify-center flex items-center gap-6">
        {!isStartedVideo && (
          <button
            className="shadow-md px-3 py-2 rounded hover:bg-slate-50 active:shadow-none"
            onClick={() => {
              startVideo();
              joinRoom();
            }}
          >
            비디오 연결
          </button>
        )}
        <button
          className="shadow-md px-3 py-2 rounded hover:bg-slate-50 active:shadow-none"
          onClick={call}
        >
          통화 시작
        </button>
      </div>
    </div>
  );
};

export default VideoChat;
