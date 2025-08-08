import { OpenVidu } from 'openvidu-browser';
import React, { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/features/auth/authStore';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AudioChatRoom = ({ roomId }) => {
  const [session, setSession] = useState(undefined);
  const [isSessionJoined, setIsSessionJoined] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [myUserName] = useState('User-' + Math.floor(Math.random() * 100));
  const audioContainer = useRef(null);

  useEffect(() => {
    if (roomId) {
      joinSession(roomId);
    }
    return () => {
      if (session) {
        leaveSession();
      }
    };
  }, [roomId]);

  const joinSession = async (currentRoomId) => {
    try {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        console.error('음성 채팅 참여 실패: 액세스 토큰이 없습니다.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/meetings/${currentRoomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // --- 상세 에러 로깅 추가 ---
      if (!response.ok) {
        const errorBody = await response.text(); // 서버가 보낸 에러 메시지를 확인
        console.error('서버 응답 에러:', { status: response.status, body: errorBody });

        if (response.status === 404) {
          console.warn(`세션(ID: ${currentRoomId})을 찾을 수 없습니다. 백엔드에서 아직 생성되지 않았을 수 있습니다.`);
          return;
        }
        // 더 구체적인 에러를 throw하여 catch 블록에서 상세 내용을 확인할 수 있도록 함
        throw new Error(`토큰 요청 실패 (status=${response.status}): ${errorBody}`);
      }

      const { openviduToken } = await response.json();

      const ov = new OpenVidu();
      const mySession = ov.initSession();
      setSession(mySession);

      mySession.on('streamCreated', (event) => {
        const subscriber = mySession.subscribe(event.stream, undefined);
        setSubscribers((prev) => [...prev, subscriber]);
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.controls = false;
        subscriber.addVideoElement(audio);
        audioContainer.current?.appendChild(audio);
      });

      mySession.on('streamDestroyed', (event) => {
        setSubscribers((prev) => prev.filter((sub) => sub.stream.streamId !== event.stream.streamId));
      });

      await mySession.connect(openviduToken, { clientData: myUserName });

      const publisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
      });

      mySession.publish(publisher);
      setIsSessionJoined(true);
    } catch (error) {
      // --- 상세 에러 로깅 추가 ---
      // error 객체 전체를 출력하여 스택 트레이스 등 더 많은 정보를 확인
      console.error('세션 참여 중 오류 발생:', error);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    setSession(undefined);
    setIsSessionJoined(false);
    setSubscribers([]);
    if (audioContainer.current) {
      audioContainer.current.innerHTML = '';
    }
  };

  if (!isSessionJoined) {
    return (
      <div className="p-4 border border-stone-200 rounded-lg mb-4 bg-stone-50">
        <h5 className="font-bold text-stone-700">🔊 음성 채팅 연결 중...</h5>
        <p className="text-sm text-stone-500">Room ID: {roomId}에 참여하고 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-green-300 rounded-lg mb-4 bg-green-50">
      <div className="flex justify-between items-center">
        <h5 className="font-bold text-green-800">🟢 음성 채팅 중 (Room: {roomId})</h5>
        <button
          onClick={leaveSession}
          className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
        >
          🚪 나가기
        </button>
      </div>
      <div className="mt-3">
        <h6 className="font-semibold text-stone-800 text-sm">참여자 목록 ({subscribers.length + 1})</h6>
        <ul className="mt-1 space-y-1">
          <li className="flex items-center text-sm text-green-700 font-semibold">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            {myUserName} (나)
          </li>
          {subscribers.map((sub, i) => (
            <li key={i} className="flex items-center text-sm text-stone-600">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
              {JSON.parse(sub.stream.connection.data).clientData}
            </li>
          ))}
        </ul>
        {subscribers.length === 0 && (
          <p className="mt-2 text-xs text-stone-500">다른 참여자를 기다리고 있습니다...</p>
        )}
      </div>
      <div ref={audioContainer} style={{ display: 'none' }}></div>
    </div>
  );
};

export default AudioChatRoom;
