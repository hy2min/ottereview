import { OpenVidu } from 'openvidu-browser';
import React, { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@/features/auth/authStore';

// 백엔드 주소는 환경 변수로 관리하는 것이 좋습니다.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AudioChatRoom = ({ roomId }) => {
  // --- 상태(State) 관리 ---
  const [session, setSession] = useState(undefined);
  const [isSessionJoined, setIsSessionJoined] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  // 사용자 이름은 실제 유저 정보로 대체하는 것을 권장합니다.
  const [myUserName] = useState('User' + Math.floor(Math.random() * 100));
  const audioContainer = useRef(null);

  // --- 핵심 로직: roomId가 변경될 때마다 자동으로 세션에 참여 ---
  useEffect(() => {
    // roomId가 유효할 때만 세션 참여 로직 실행
    if (roomId) {
      joinSession(roomId);
    }

    // 컴포넌트가 언마운트되거나 roomId가 변경될 때 기존 세션 연결을 해제 (클린업)
    return () => {
      if (session) {
        leaveSession();
      }
    };
  }, [roomId]); // roomId가 변경될 때마다 이 useEffect가 다시 실행됩니다.

  // --- 세션 참여 함수 ---
  const joinSession = async (currentRoomId) => {
    try {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        console.error('음성 채팅 참여 실패: 액세스 토큰이 없습니다.');
        return;
      }

      // OpenVidu 토큰을 백엔드로부터 요청
      const response = await fetch(`${BACKEND_URL}/api/meetings/${currentRoomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        // 404 Not Found는 아직 백엔드에 세션이 생성되지 않았음을 의미할 수 있습니다.
        if (response.status === 404) {
          console.warn(`세션(ID: ${currentRoomId})을 찾을 수 없습니다. 아직 생성되지 않았을 수 있습니다.`);
          // 이 경우, 사용자에게 잠시 후 다시 시도하라는 메시지를 보여줄 수 있습니다.
          return;
        }
        throw new Error(`토큰 요청 실패 (status=${response.status})`);
      }

      const { openviduToken } = await response.json();

      // --- OpenVidu 초기화 및 세션 설정 ---
      const ov = new OpenVidu();
      const mySession = ov.initSession();
      setSession(mySession);

      // 다른 사용자가 스트림을 생성했을 때(입장했을 때) 실행될 이벤트 핸들러
      mySession.on('streamCreated', (event) => {
        const subscriber = mySession.subscribe(event.stream, undefined);
        setSubscribers((prev) => [...prev, subscriber]);

        // 오디오 요소를 생성하여 스트림을 재생
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.controls = false; // 오디오 컨트롤러는 보이지 않게 설정
        subscriber.addVideoElement(audio);
        audioContainer.current?.appendChild(audio);
      });

      // 다른 사용자가 스트림을 파괴했을 때(퇴장했을 때) 실행될 이벤트 핸들러
      mySession.on('streamDestroyed', (event) => {
        // 해당 구독자를 상태에서 제거하는 로직 (구현 필요)
      });

      // 생성된 토큰을 사용하여 세션에 연결
      await mySession.connect(openviduToken, { clientData: myUserName });

      // 내 오디오/비디오를 송출할 퍼블리셔 초기화
      const publisher = await ov.initPublisherAsync(undefined, {
        audioSource: undefined, // 기본 마이크
        videoSource: false, // 비디오는 사용 안 함
        publishAudio: true,
        publishVideo: false,
      });

      // 내 스트림을 세션에 발행
      mySession.publish(publisher);
      setIsSessionJoined(true); // 세션 참여 완료 상태로 변경
    } catch (error) {
      console.error('세션 참여 중 오류 발생:', error);
      // 사용자에게 실패 메시지를 보여줄 수 있습니다.
    }
  };

  // --- 세션 떠나기 함수 ---
  const leaveSession = () => {
    if (session) {
      session.disconnect(); // 세션 연결 해제
    }
    // 모든 관련 상태 초기화
    setSession(undefined);
    setIsSessionJoined(false);
    setSubscribers([]);
    if (audioContainer.current) {
      audioContainer.current.innerHTML = ''; // 오디오 요소들 제거
    }
  };

  // --- UI 렌더링 ---

  // 세션에 참여 중이 아닐 때 보여줄 로딩 화면
  if (!isSessionJoined) {
    return (
      <div className="p-4 border border-stone-200 rounded-lg mb-4 bg-stone-50">
        <h5 className="font-bold text-stone-700">🔊 음성 채팅 연결 중...</h5>
        <p className="text-sm text-stone-500">Room ID: {roomId}에 참여하고 있습니다.</p>
      </div>
    );
  }

  // 세션에 성공적으로 참여했을 때 보여줄 화면
  return (
    <div className="p-4 border border-green-300 rounded-lg mb-4 bg-green-50">
      <h5 className="font-bold text-green-800">🟢 음성 채팅 중 (Room: {roomId})</h5>
      <div className="my-2">
        <p className="text-sm font-semibold">{myUserName} (나)</p>
        <h6 className="text-xs font-bold mt-2">참여자 목록</h6>
        <ul className="text-xs list-disc list-inside">
          {subscribers.map((sub, i) => (
            <li key={i}>{JSON.parse(sub.stream.connection.data).clientData}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={leaveSession}
        className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full hover:bg-red-600"
      >
        🚪 나가기
      </button>
      {/* 오디오 요소를 담을 컨테이너 (화면에는 보이지 않음) */}
      <div ref={audioContainer} style={{ display: 'none' }}></div>
    </div>
  );
};

export default AudioChatRoom;
