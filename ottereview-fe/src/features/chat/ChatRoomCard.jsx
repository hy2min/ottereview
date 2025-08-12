import { useNavigate } from 'react-router-dom';

const ChatRoomCard = ({ room }) => {
  const navigate = useNavigate();

  return (
    <div
      className="border p-3 rounded hover:bg-gray-100 cursor-pointer"
      onClick={() => navigate(`/chatroom/${room.roomId}`)} // room.id -> room.roomId 로 수정
    >
      <div className="text-sm font-medium">{room.roomName}</div>
      {/* <div className="text-xs text-gray-600">참여자: {Array.isArray(room.members) ? room.members.join(', ') : '없음'}</div> */}
    </div>
  );
};

export default ChatRoomCard;
