import { assert, describe, test } from "matchstick-as";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { jobEntityId } from "./job";

const CHAIN_ID = BigInt.fromI32(11155111);
const CONTRACT = Address.fromString("0x0747EEf0706327138c69792bF28Cd525089e4583");

describe("jobEntityId", () => {
  test("encodes chain ID, contract, and job ID joined with ':'", () => {
    const id = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(7));
    assert.stringEquals("11155111:0x0747eef0706327138c69792bf28cd525089e4583:7", id.toString());
  });

  test("is stable for the same chain, contract, and job ID", () => {
    const a = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(7));
    const b = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(7));
    assert.bytesEquals(a, b);
  });

  test("differs for different job IDs on the same contract", () => {
    const a = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(1));
    const b = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(12));
    assert.assertTrue(a.notEqual(b));
  });

  test("differs for different contracts with the same job ID", () => {
    const other = Address.fromString("0x0000000000000000000000000000000000000002");
    const a = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(1));
    const b = jobEntityId(CHAIN_ID, other, BigInt.fromI32(1));
    assert.assertTrue(a.notEqual(b));
  });

  test("differs for the same contract address on different chains", () => {
    // The chain ID keeps entity IDs globally unique when the contract is
    // deployed at the same address on several chains (see chain.config.json).
    const a = jobEntityId(CHAIN_ID, CONTRACT, BigInt.fromI32(1));
    const b = jobEntityId(BigInt.fromI32(84532), CONTRACT, BigInt.fromI32(1));
    assert.assertTrue(a.notEqual(b));
  });
});
