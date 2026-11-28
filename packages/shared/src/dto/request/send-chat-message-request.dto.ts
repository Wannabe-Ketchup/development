export interface SendChatMessageRequest {
  // 화면이 메시지마다 만드는 UUID. 응답을 못 받아 다시 보낼 때는 같은 값을 쓴다
  clientMessageId: string;
  content: string;
}
