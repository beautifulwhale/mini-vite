import WebSocket, { WebSocketServer } from "ws";
import { red } from "picocolors";

export type WsServer = {
    send: (payload: any) => void;
    close: () => void;
};

export function createWebSocketServer(): WsServer {
    const wss = new WebSocketServer({
        port: 24678,
    });

    wss.on("connection", (socket) => {
        socket.send(JSON.stringify({ type: "connected" }));
    });
    wss.on("error", (e: Error & { code: string }) => {
        if (e.code !== "EADDRINUSE") {
            console.error(
                red(`WebSocket server error:\n${e.stack || e.message}`)
            );
        }
    });

    // 返回发送消息、关闭连接的方法
    return {
        send: (payload: any) => {
            const stringified = JSON.stringify(payload);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(stringified);
                }
            });
        },
        close: () => {
            wss.close();
        },
    };
}
