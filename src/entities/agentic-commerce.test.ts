import { assert, describe, test } from "matchstick-as";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { agenticCommerceEntityId } from "./agentic-commerce";

const CHAIN_ID = BigInt.fromI32(11155111);
const CONTRACT = Address.fromString("0x0747EEf0706327138c69792bF28Cd525089e4583");

describe("agenticCommerceEntityId", () => {
  test("encodes chain ID and contract address joined with ':'", () => {
    const id = agenticCommerceEntityId(CHAIN_ID, CONTRACT);
    assert.stringEquals("11155111:0x0747eef0706327138c69792bf28cd525089e4583", id.toString());
  });

  test("is stable for the same chain and contract", () => {
    const a = agenticCommerceEntityId(CHAIN_ID, CONTRACT);
    const b = agenticCommerceEntityId(CHAIN_ID, CONTRACT);
    assert.bytesEquals(a, b);
  });

  test("differs for the same contract address on different chains", () => {
    // The chain ID keeps entity IDs globally unique when the contract is
    // deployed at the same address on several chains (see chain.config.json).
    const a = agenticCommerceEntityId(CHAIN_ID, CONTRACT);
    const b = agenticCommerceEntityId(BigInt.fromI32(84532), CONTRACT);
    assert.assertTrue(a.notEqual(b));
  });

  test("differs for different contracts on the same chain", () => {
    const other = Address.fromString("0x0000000000000000000000000000000000000002");
    const a = agenticCommerceEntityId(CHAIN_ID, CONTRACT);
    const b = agenticCommerceEntityId(CHAIN_ID, other);
    assert.assertTrue(a.notEqual(b));
  });
});
