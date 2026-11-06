const WebSocket = require("ws");
const Blockchain = require("../blockchain");

const p2pPort = process.env.P2P_PORT || 5001;
const peers = process.env.PEERS
  ? [...new Set(process.env.PEERS.split(","))]
  : [];

const logSocketError = (err) =>
  console.log(`Socket error: ${err.message || err.code}`);

class P2PServer {
  constructor(blockchain) {
    this.blockchain = blockchain;
    this.sockets = [];
  }

  listen() {
    const server = new WebSocket.Server({ port: p2pPort });
    server.on("connection", (socket) => {
      socket.on("error", logSocketError);
      this.connectSocket(socket);
    });

    this.connectToPeers();
    console.log(`Listening for peer-to-peer connections on: ${p2pPort}`);
  }

  connectToPeers() {
    peers.forEach((peer) => {
      const socket = new WebSocket(peer);
      socket.on("error", logSocketError);
      socket.on("open", () => this.connectSocket(socket));
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log("Socket connected");
    this.messageHandler(socket);
    this.closeHandler(socket);
    this.sendChain(socket);
  }

  messageHandler(socket) {
    socket.on("message", (message) => {
      try {
        const chain = JSON.parse(message);

        // Chỉ chuyển tiếp khi chain thật sự đổi, nên message không lặp vô tận.
        if (Array.isArray(chain) && this.blockchain.replaceChain(chain)) {
          this.syncChains();
        }
      } catch (err) {
        console.log(`Ignored invalid message from peer: ${err.message}`);
      }
    });
  }

  closeHandler(socket) {
    socket.on("close", () => {
      this.sockets = this.sockets.filter((s) => s !== socket);
      console.log("Socket disconnected");
    });
  }

  sendChain(socket) {
    socket.send(JSON.stringify(this.blockchain.chain));
  }

  syncChains() {
    this.sockets.forEach((socket) => this.sendChain(socket));
  }
}

module.exports = P2PServer;
