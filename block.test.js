const SHA256 = require("crypto-js/sha256");
const Block = require("./block");

describe("Block", () => {
  describe("constructor", () => {
    it("gán đúng các thuộc tính", () => {
      const block = new Block(123, "last-hash", "hash", "data");

      expect(block.timestamp).toBe(123);
      expect(block.lastHash).toBe("last-hash");
      expect(block.hash).toBe("hash");
      expect(block.data).toBe("data");
    });
  });

  describe("genesis()", () => {
    it("trả về một instance của Block", () => {
      expect(Block.genesis()).toBeInstanceOf(Block);
    });

    it("có các giá trị cố định", () => {
      const genesis = Block.genesis();

      expect(genesis.timestamp).toBe("Genesis time");
      expect(genesis.lastHash).toBe("-----");
      expect(genesis.hash).toBe("f1r57-h45h");
      expect(genesis.data).toEqual([]);
    });

    it("các lần gọi cho kết quả giống nhau nhưng là object riêng", () => {
      const first = Block.genesis();
      const second = Block.genesis();

      expect(first).toEqual(second);
      expect(first).not.toBe(second);
    });
  });

  describe("hash()", () => {
    it("là SHA256 của timestamp, lastHash và data ghép lại", () => {
      const expected = SHA256("123last-hashdata").toString();

      expect(Block.hash(123, "last-hash", "data")).toBe(expected);
    });

    it("trả về chuỗi hex 64 ký tự", () => {
      expect(Block.hash(123, "last-hash", "data")).toMatch(/^[0-9a-f]{64}$/);
    });

    it("cùng input thì cùng hash", () => {
      expect(Block.hash(123, "last-hash", "data")).toBe(
        Block.hash(123, "last-hash", "data"),
      );
    });

    it.each([
      ["timestamp", [456, "last-hash", "data"]],
      ["lastHash", [123, "other-hash", "data"]],
      ["data", [123, "last-hash", "other-data"]],
    ])("đổi %s thì hash đổi", (_field, args) => {
      expect(Block.hash(...args)).not.toBe(
        Block.hash(123, "last-hash", "data"),
      );
    });
  });

  describe("mineBlock()", () => {
    const NOW = 1700000000000;
    const data = "foo-data";
    let lastBlock;
    let block;

    beforeEach(() => {
      jest.spyOn(Date, "now").mockReturnValue(NOW);
      lastBlock = Block.genesis();
      block = Block.mineBlock(lastBlock, data);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("trả về một instance của Block", () => {
      expect(block).toBeInstanceOf(Block);
    });

    it("lưu data được truyền vào", () => {
      expect(block.data).toBe(data);
    });

    it("lastHash trỏ tới hash của block trước", () => {
      expect(block.lastHash).toBe(lastBlock.hash);
    });

    it("timestamp lấy từ Date.now()", () => {
      expect(block.timestamp).toBe(NOW);
    });

    it("hash được tính từ chính nội dung của block", () => {
      expect(block.hash).toBe(Block.hash(NOW, lastBlock.hash, data));
    });

    it("nối được thành chuỗi nhiều block", () => {
      const next = Block.mineBlock(block, "bar-data");

      expect(next.lastHash).toBe(block.hash);
      expect(next.hash).not.toBe(block.hash);
    });

    it("không làm thay đổi block trước", () => {
      const snapshot = { ...lastBlock };

      Block.mineBlock(lastBlock, data);

      expect(lastBlock).toEqual(snapshot);
    });
  });

  describe("toString()", () => {
    it("hiển thị timestamp, data và 10 ký tự đầu của các hash", () => {
      const block = new Block(123, "abcdefghijKLMNOP", "0123456789WXYZ", "data");
      const output = block.toString();

      expect(output).toContain("Timestamp : 123");
      expect(output).toContain("Last Hash : abcdefghij\n");
      expect(output).toContain("Hash      : 0123456789\n");
      expect(output).toContain("Data      : data");
    });

    it("không hiển thị phần hash sau ký tự thứ 10", () => {
      const block = new Block(123, "abcdefghijKLMNOP", "0123456789WXYZ", "data");
      const output = block.toString();

      expect(output).not.toContain("KLMNOP");
      expect(output).not.toContain("WXYZ");
    });
  });
});
