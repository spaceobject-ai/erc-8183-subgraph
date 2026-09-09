import { afterEach, assert, clearStore, describe, newMockEvent, test } from "matchstick-as";
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { PaymentReleased } from "../../../generated/AgenticCommerce/AgenticCommerce";
import { handlePaymentReleased } from "./payments";

describe("Agentic Commerce payment handlers", () => {
  afterEach(() => {
    clearStore();
  });

  // Matchstick 0.6 cannot store GraphQL Timestamp values yet. This covers the
  // missing-job guard without saving entities that contain Timestamp fields.
  test("ignores a payment for an unknown job", () => {
    const event = changetype<PaymentReleased>(newMockEvent());
    event.address = Address.fromString("0x0747eef0706327138c69792bf28cd525089e4583");
    event.parameters = [
      new ethereum.EventParam("jobId", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
      new ethereum.EventParam(
        "recipient",
        ethereum.Value.fromAddress(
          Address.fromString("0x0000000000000000000000000000000000000002"),
        ),
      ),
      new ethereum.EventParam(
        "token",
        ethereum.Value.fromAddress(
          Address.fromString("0x0000000000000000000000000000000000000004"),
        ),
      ),
      new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(500))),
    ];

    handlePaymentReleased(event);

    assert.entityCount("Job", 0);
    assert.entityCount("JobEvent", 0);
  });
});
