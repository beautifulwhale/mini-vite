import { Update } from "./type";
console.log("[vite] connecting...");

const ws = new WebSocket(`ws://localhost:__HMR_PORT__`, "vite-hmr");

ws.addEventListener("message", async (message) => {
    handleMessage(JSON.parse(message.data)).catch(console.error);
});

async function handleMessage(payload: any) {
    const { type } = payload;
    switch (type) {
        case "connected":
            console.log("[vite] connected");
            setInterval(() => {
                ws.send("ping...");
            });
            break;
        case "updated":
            payload.updates.forEach((u: Update) => {
                if (u.type === "js-changed") {
                    // TODO:
                    console.log("u", u);
                }
            });
            break;
        default:
            break;
    }
}
