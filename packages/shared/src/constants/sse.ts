// 서버는 연결마다 이 간격으로 heartbeat를 보내고, web은 이 간격을 기준으로 끊긴 연결을 판단한다
export const SSE_HEARTBEAT_INTERVAL_MS = 15_000;
