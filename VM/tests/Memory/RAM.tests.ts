import RAM from "../../VirtualMachine/Memory/RAM";
import * as helpers from "../helpers";

describe("A ram object", () => {
    let ram : RAM;
    let maxRamSize = 1000;
    let ramSize : number;
    let dataPosition : number;    
    let storedWord : number;
    let storedByte : number;

    beforeEach(() => {
        ramSize = helpers.randomInt(10, maxRamSize) * 4;
        dataPosition = helpers.randomInt(0, ramSize);
        storedWord = 1 << helpers.randomInt(1, 15);
        storedByte = 1 << helpers.randomInt(1, 7);

        ram = new RAM(ramSize);
    });

    it("has a capacity property which returns the total size available", () => {
        expect(ram.capacity).toEqual(ramSize);
    });

    it("has a capacity property which returns the total size available", () => {
        expect(ram.capacity).toEqual(ramSize);
    });

    it("has storeWord and readWord methods", () => {
        ram.storeWord(dataPosition, storedWord);

        let actual = ram.readWord(dataPosition);

        expect(actual).toEqual(storedWord);
    });

    it("has storeWord and readWord methods which store their data in the same position", () => {
        ram.storeWord(0, 32767);

        let actual = ram.readWord(0);

        expect(actual).toEqual(32767);
    });

    it("has storeByte and readByte methods", () => {
        ram.storeByte(dataPosition, storedByte);

        let actual = ram.readByte(dataPosition);

        expect(actual).toEqual(storedByte);
    });

    describe("The store* and read* methods", () => {
        it("read and write to the same backing store", () => {
            ram.storeWord(0, 32767);

            let actual0 = ram.readByte(0);
            let actual1 = ram.readByte(1);

            expect(actual0).toEqual(-1);
            expect(actual1).toEqual(127);
        });
    });

    describe("The 32 bit store and read methods", () => {
        it("read and write to the same backing store", () => {
            ram.storeDWord(0, 2147483647);

            let actual0 = ram.readByte(0);
            let actual1 = ram.readByte(1);
            let actual2 = ram.readByte(2);
            let actual3 = ram.readByte(3);

            expect(actual0).toEqual(-1);
            expect(actual1).toEqual(-1);
            expect(actual2).toEqual(-1);
            expect(actual3).toEqual(127);
        });
    });
});