import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  dataSourceMock,
  describe,
  newMockEvent,
  test,
} from "matchstick-as";
import { Address, BigInt, Bytes, DataSourceContext, ethereum } from "@graphprotocol/graph-ts";
import { BudgetSet } from "../../../generated/AgenticCommerce/AgenticCommerce";
import { handleBudgetSet } from "./job";

beforeAll(() => {
  // Mirrors the `chainId` context that subgraph.template.yaml sets for the
  // AgenticCommerce data source; job entity IDs are chain-scoped.
  const context = new DataSourceContext();
  context.setBigInt("chainId", BigInt.fromI32(11155111));
  dataSourceMock.setReturnValues(contractAddress().toHexString(), "sepolia", context);
});

describe("Agentic Commerce job handlers", () => {
  afterEach(() => {
    clearStore();
  });

  // Matchstick 0.6 cannot store GraphQL Timestamp values yet. These tests cover
  // missing-job guards without saving entities that contain Timestamp fields.
  test("ignores a budget event for an unknown job", () => {
    const event = changetype<BudgetSet>(baseEvent());
    event.parameters = [
      new ethereum.EventParam("jobId", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
      new ethereum.EventParam("token", ethereum.Value.fromAddress(tokenAddress())),
      new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(500))),
    ];

    handleBudgetSet(event);

    assert.entityCount("Job", 0);
    assert.entityCount("JobEvent", 0);
  });
});

function baseEvent(): ethereum.Event {
  const event = newMockEvent();
  event.address = contractAddress();
  event.block.number = BigInt.fromI32(11);
  event.block.timestamp = BigInt.fromI32(1100);
  event.transaction.hash = Bytes.fromHexString(
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  );
  event.logIndex = BigInt.fromI32(1);
  return event;
}

function contractAddress(): Address {
  return Address.fromString("0x0747eef0706327138c69792bf28cd525089e4583");
}

function tokenAddress(): Address {
  return Address.fromString("0x0000000000000000000000000000000000000004");
}
