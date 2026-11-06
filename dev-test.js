const Block = require("./block");

const block = Block.mineBlock(Block.genesis(), "foo-data");

console.log(block.toString());
