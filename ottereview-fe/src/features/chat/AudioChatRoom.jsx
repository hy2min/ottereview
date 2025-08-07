import { OpenVidu } from 'openvidu-browser'
import React, { useEffect, useRef, useState } from 'react'

const BACKEND_URL = 'http://i13c108.p.ssafy.io:8080' // Spring 백엔드 주소

const AudioChatRoom = () => {
  const [mySessionId, setMySessionId] = useState('TestRoom')
  const [myUserName, setMyUserName] = useState('Participant' + Math.floor(Math.random() * 100))
  const [session, setSession] = useState(undefined)
  const [OV, setOV] = useState(undefined)

  const audioContainer = useRef(null)

  useEffect(() => {
    return () => leaveSession()
  }, [])

  const joinSession = async () => {
    const OVInstance = new OpenVidu()
    setOV(OVInstance)

    const mySession = OVInstance.initSession()
    setSession(mySession)

    mySession.on('streamCreated', (event) => {
      const subscriber = mySession.subscribe(event.stream, undefined)
      subscriber.addVideoElement(createAudioElement())
    })

    try {
      const token = await getToken(mySessionId)

      await mySession.connect(token, { clientData: myUserName })

      const publisher = await OVInstance.initPublisherAsync(undefined, {
        audioSource: undefined,
        videoSource: false,
      })

      mySession.publish(publisher)
    } catch (error) {
      console.error('There was an error connecting to the session:', error)
    }
  }

  const leaveSession = () => {
    if (session) {
      session.disconnect()
    }
    setOV(undefined)
    setSession(undefined)
    audioContainer.current.innerHTML = ''
  }

  const getToken = async (sessionId) => {
    const token = localStorage.getItem('accessToken')

    console.log('📦 보내는 토큰:', token)
    // 1. 백엔드에 세션 생성 요청
    const createResponse = await fetch(`${BACKEND_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ 여기 필수
      },
      body: JSON.stringify({
        prId: 1,
        roomName: sessionId,
        inviteeIds: [],
      }),
    })

    if (!createResponse.ok) {
      const msg = await createResponse.text()
      throw new Error(`세션 생성 실패 (status=${createResponse.status}): ${msg}`)
    }

    // 2. 백엔드에 토큰 요청
    const tokenResponse = await fetch(`${BACKEND_URL}/api/meetings/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ 여기도 필요
      },
    })

    if (!tokenResponse.ok) {
      const msg = await tokenResponse.text()
      throw new Error(`토큰 요청 실패 (status=${tokenResponse.status}): ${msg}`)
    }

    const tokenData = await tokenResponse.json()
    return tokenData.openviduToken
  }

  const createAudioElement = () => {
    const audio = document.createElement('audio')
    audio.autoplay = true
    audio.controls = true
    audioContainer.current.appendChild(audio)
    return audio
  }

  return (
    <div style={{ padding: '2rem' }}>
      {!session ? (
        <>
          <h2>🔊 음성 회의실</h2>
          <input
            placeholder="참가자 이름"
            value={myUserName}
            onChange={(e) => setMyUserName(e.target.value)}
          />
          <input
            placeholder="방 번호"
            value={mySessionId}
            onChange={(e) => setMySessionId(e.target.value)}
          />
          <button onClick={joinSession}>회의 참가</button>
        </>
      ) : (
        <>
          <h2>🟢 음성 채팅방 ({mySessionId})</h2>
          <button onClick={leaveSession}>🚪 나가기</button>
          <div ref={audioContainer}></div>
        </>
      )}
    </div>
  )
}

export default AudioChatRoom
