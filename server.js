
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

let viewers = [];

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    // retransmitir a todos excepto al que envió
    for (const v of viewers) {
      if (v !== ws && v.readyState === WebSocket.OPEN) v.send(msg);
    }
  });

  viewers.push(ws);

  ws.on("close", () => {
    viewers = viewers.filter(v => v !== ws);
  });
});

