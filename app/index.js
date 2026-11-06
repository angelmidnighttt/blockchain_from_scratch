const express = require("express");
const Blockchain = require("../blockchain");
const dotenv = require("dotenv");

dotenv.config();

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
  res.redirect("/blocks");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
