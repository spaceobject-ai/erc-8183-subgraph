import { assert, describe, test } from "matchstick-as";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { AgenticCommerce } from "../../../generated/schema";
import { updatePauseState } from "../../entities/agentic-commerce";

describe("Agentic Commerce admin handlers", () => {
  // Matchstick 0.6 cannot save Timestamp fields, so this exercises the shared
  // pause mutation before the handlers persist the entity.
  test("updates pause state and timestamp", () => {
    const agenticCommerce = new AgenticCommerce(
      Address.fromString("0x0747eef0706327138c69792bf28cd525089e4583"),
    );

    updatePauseState(agenticCommerce, true, BigInt.fromI32(1000));
    assert.assertTrue(agenticCommerce.paused);
    assert.assertTrue(agenticCommerce.updatedAt == 1000);

    updatePauseState(agenticCommerce, false, BigInt.fromI32(1100));
    assert.assertTrue(!agenticCommerce.paused);
    assert.assertTrue(agenticCommerce.updatedAt == 1100);
  });
});
