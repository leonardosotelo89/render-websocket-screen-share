//(compatible con JSON signaling + frames binarios)
import http from "http";
import { WebSocketServer } from "ws";

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {

  // cada cliente puede tener un id (tu señalización original)
  ws.id = null;

  ws.on("message", (msg, isBinary) => {
    // 1) Si es BINARY → reenviar tal cual a todos menos al sender
    if (isBinary) {
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === 1) {
          client.send(msg, { binary: true });
        }
      }
      return;
    }

    // 2) Si es STRING → procesar como señalización JSON (tu lógica vieja)
    let data;
    try {
      data = JSON.parse(msg.toString());
    } catch {
      return;
    }

    // mensaje esperado: {type, to, from, payload}

    // registrar id en "hello"
    if (data.type === "hello") {
      ws.id = data.id;            // igual a tu server original
      console.log("connected:", ws.id);
      return;
    }

    // enviar a destinatario específico
    if (data.to) {
      for (const client of wss.clients) {
        if (client.readyState === 1 && client.id === data.to) {
          client.send(JSON.stringify(data));
        }
      }
      return;
    }

    // broadcast general
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    }
  });

  ws.on("close", () => console.log("client disconnected:", ws.id));
});

server.listen(process.env.PORT || 8080, () =>
  console.log("Server running on", process.env.PORT || 8080)
);

/*
Qué hace este server
1) Cuando recibe binario:

→ lo reenvía sin modificarlo.
→ esto permite frames WebP, PNG, JPEG o lo que quieras.

2) Cuando recibe texto:

→ intenta parsear JSON.
→ si es {type:"hello", id:"..."} asigna ws.id.
→ si tiene to: "peerId" envía solo a ese cliente.
→ si no, hace broadcast.
*/
