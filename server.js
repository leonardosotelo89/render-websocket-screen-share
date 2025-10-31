import http from "http";
import { WebSocketServer } from "ws";

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // Mensaje esperado: {type, to, from, payload}
    if (data.to) {
      // enviar solo al destinatario
      for (const client of wss.clients) {
        if (client.readyState === 1 && client.id === data.to) {
          client.send(JSON.stringify(data));
        }
      }
    } else {
      // broadcast general (por ejemplo, "hello")
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === 1)
          client.send(JSON.stringify(data));
      }
    }
  });

  ws.on("close", () => console.log("client disconnected"));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "hello") {
        ws.id = data.id;
        console.log("connected:", ws.id);
      }
    } catch {}
  });
});

server.listen(process.env.PORT || 8080, () =>
  console.log("Signaling server running on port 8080")
);