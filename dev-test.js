const Block = require('./block');

const block = new Block('foo', 'bar', 'baz', 'qux');
console.log(block.toString());

const genesisBlock = Block.genesis();
console.log(genesisBlock.toString());