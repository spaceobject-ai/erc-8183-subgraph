import { assert, describe, test } from "matchstick-as";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { jobEntityId } from "./ids";

describe("Agentic Commerce entity IDs", () => {
  test("scopes job IDs by contract address", () => {
    const first = jobEntityId(
      Address.fromString("0x0747eef0706327138c69792bf28cd525089e4583"),
      BigInt.fromI32(1),
    );
    const second = jobEntityId(
      Address.fromString("0x0000000000000000000000000000000000000002"),
      BigInt.fromI32(1),
    );

    assert.assertTrue(first.toHexString() != second.toHexString());
  });
});
