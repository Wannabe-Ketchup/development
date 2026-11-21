export interface ChatMessage {
  // 방 안에서 1부터 1씩 커지는 번호. 화면은 이 값으로 chat_message와 chat_history를 합친다
  id: number;
  senderId: string;
  // 보낸 당시 닉네임. 이후 닉네임을 바꾸거나 퇴장해도 그대로 남는다
  nickname: string;
  content: string;
  // 서버가 받은 시각(ISO 8601)
  sentAt: string;
}

// 연결이 열릴 때 그 연결에만 보내는 입장 뒤 메시지 묶음. 나중에 값을 더해도 모양이 깨지지 않게 감싼다
export interface ChatHistory {
  messages: ChatMessage[];
}
