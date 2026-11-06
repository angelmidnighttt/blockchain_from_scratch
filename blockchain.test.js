const Block = require("./block");
const Blockchain = require("./blockchain");

describe("Blockchain", () => {
  let blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe("constructor", () => {
    it("khởi tạo chain chỉ có một block", () => {
      expect(blockchain.chain).toHaveLength(1);
    });

    it("block đầu tiên là genesis block", () => {
      expect(blockchain.chain[0]).toBeInstanceOf(Block);
      expect(blockchain.chain[0]).toEqual(Block.genesis());
    });

    it("mỗi blockchain có chain riêng", () => {
      const other = new Blockchain();

      blockchain.addBlock("foo-data");

      expect(blockchain.chain).toHaveLength(2);
      expect(other.chain).toHaveLength(1);
    });
  });

  describe("addBlock()", () => {
    const data = "foo-data";

    it("thêm đúng một block vào cuối chain", () => {
      blockchain.addBlock(data);

      expect(blockchain.chain).toHaveLength(2);
      expect(blockchain.chain[1].data).toBe(data);
    });

    it("trả về chính block vừa thêm", () => {
      const block = blockchain.addBlock(data);

      expect(block).toBeInstanceOf(Block);
      expect(block).toBe(blockchain.chain[blockchain.chain.length - 1]);
    });

    it("lastHash của block mới trỏ tới hash của block cuối", () => {
      const genesis = blockchain.chain[0];

      const block = blockchain.addBlock(data);

      expect(block.lastHash).toBe(genesis.hash);
    });

    it("hash của block mới được tính từ chính nội dung của nó", () => {
      const block = blockchain.addBlock(data);

      expect(block.hash).toBe(
        Block.hash(block.timestamp, block.lastHash, block.data),
      );
    });

    it("thêm nhiều block thì giữ đúng thứ tự và liên kết", () => {
      blockchain.addBlock("first");
      blockchain.addBlock("second");
      blockchain.addBlock("third");

      const { chain } = blockchain;

      expect(chain.map((block) => block.data)).toEqual([
        [],
        "first",
        "second",
        "third",
      ]);

      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].lastHash).toBe(chain[i - 1].hash);
      }
    });

    it("không làm thay đổi các block đã có", () => {
      const first = blockchain.addBlock("first");
      const snapshot = blockchain.chain.map((block) => ({ ...block }));

      blockchain.addBlock("second");

      expect(blockchain.chain[0]).toEqual(snapshot[0]);
      expect(blockchain.chain[1]).toBe(first);
      expect(blockchain.chain[1]).toEqual(snapshot[1]);
    });
  });

  describe("isValidChain()", () => {
    let validator;

    beforeEach(() => {
      validator = new Blockchain();
      blockchain.addBlock("first");
      blockchain.addBlock("second");
      blockchain.addBlock("third");
    });

    describe("chain hợp lệ", () => {
      it("chain chỉ có genesis", () => {
        expect(validator.isValidChain(validator.chain)).toBe(true);
      });

      it("chain nhiều block, kiểm tra từ một blockchain khác", () => {
        expect(validator.isValidChain(blockchain.chain)).toBe(true);
      });
    });

    describe("genesis không đúng", () => {
      it("chain rỗng", () => {
        expect(validator.isValidChain([])).toBe(false);
      });

      it.each([
        ["timestamp", "fake-time"],
        ["lastHash", "fake-last-hash"],
        ["hash", "fake-hash"],
        ["data", ["fake-data"]],
      ])("genesis bị sửa %s", (field, value) => {
        const chain = [Block.genesis()];
        chain[0][field] = value;

        expect(validator.isValidChain(chain)).toBe(false);
      });

      it("các block liên kết đúng nhưng xuất phát từ genesis giả", () => {
        const fakeGenesis = new Block("fake-time", "-----", "fake-hash", []);
        const block = Block.mineBlock(fakeGenesis, "foo-data");

        expect(validator.isValidChain([fakeGenesis, block])).toBe(false);
      });
    });

    describe("block bị giả mạo", () => {
      it.each([
        ["timestamp", 123],
        ["lastHash", "fake-last-hash"],
        ["hash", "fake-hash"],
        ["data", "fake-data"],
      ])("block cuối bị sửa %s", (field, value) => {
        const { chain } = blockchain;
        chain[chain.length - 1][field] = value;

        expect(validator.isValidChain(chain)).toBe(false);
      });

      it("block ngay sau genesis bị sửa data", () => {
        blockchain.chain[1].data = "fake-data";

        expect(validator.isValidChain(blockchain.chain)).toBe(false);
      });

      it("sửa block rồi tính lại hash thì đứt liên kết với block sau", () => {
        const block = blockchain.chain[1];
        block.data = "fake-data";
        block.hash = Block.blockHash(block);

        expect(validator.isValidChain(blockchain.chain)).toBe(false);
      });

      // Lỗi đã biết: Block.hash ghép data bằng template string nên mọi object
      // đều thành "[object Object]". Sửa xong Block.hash thì đổi thành it().
      it.failing("sửa nội dung của data kiểu object", () => {
        const block = blockchain.addBlock({ amount: 10 });
        block.data.amount = 1000;

        expect(validator.isValidChain(blockchain.chain)).toBe(false);
      });
    });

    describe("cấu trúc chain bị thay đổi", () => {
      it("đảo thứ tự hai block", () => {
        const { chain } = blockchain;
        [chain[1], chain[2]] = [chain[2], chain[1]];

        expect(validator.isValidChain(chain)).toBe(false);
      });

      it("xóa một block ở giữa", () => {
        blockchain.chain.splice(2, 1);

        expect(validator.isValidChain(blockchain.chain)).toBe(false);
      });
    });
  });
});
