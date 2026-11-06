const express = require("express");
const Blockchain = require("../blockchain");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const blockchain = new Blockchain();

const port = process.env.PORT || 3000;

app.get("/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
