const express = require("express");
const Blockchain = require("../blockchain");
const dotenv = require("dotenv");

dotenv.config();

// Phải đứng sau dotenv.config() vì p2p-server đọc biến môi trường ngay khi load.
const P2PServer = require("./p2p-server");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const blockchain = new Blockchain();

const port = process.env.PORT || 3000;

app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/mine", (req, res) => {
  const { data } = req.body;
  const newBlock = blockchain.addBlock(data);
  console.log(`New block added: ${newBlock.toString()}`);
  p2pServer.syncChains();
  res.redirect("/blocks");
});

const p2pServer = new P2PServer(blockchain);
p2pServer.listen();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
