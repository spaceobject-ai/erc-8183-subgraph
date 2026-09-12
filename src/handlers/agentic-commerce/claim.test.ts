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
import { ClaimSubmitted } from "../../../generated/AgenticCommerce/AgenticCommerce";
import { handleClaimSubmitted } from "./claim";

const CONTRACT = Address.fromString("0x0747eef0706327138c69792bf28cd525089e4583");

beforeAll(() => {
  // Mirrors the `chainId` context that subgraph.template.yaml sets for the
  // AgenticCommerce data source; job entity IDs are chain-scoped.
  const context = new DataSourceContext();
  context.setBigInt("chainId", BigInt.fromI32(11155111));
  dataSourceMock.setReturnValues(CONTRACT.toHexString(), "sepolia", context);
});

describe("Agentic Commerce claim handlers", () => {
  afterEach(() => {
    clearStore();
  });

  // Matchstick 0.6 cannot store GraphQL Timestamp values yet. This covers the
  // missing-job guard without saving entities that contain Timestamp fields.
  test("ignores a claim for an unknown job", () => {
    const event = changetype<ClaimSubmitted>(newMockEvent());
    event.address = CONTRACT;
    event.parameters = [
      new ethereum.EventParam("jobId", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
      new ethereum.EventParam(
        "provider",
        ethereum.Value.fromAddress(
          Address.fromString("0x0000000000000000000000000000000000000002"),
        ),
      ),
      new ethereum.EventParam(
        "cumulativeAmount",
        ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(200)),
      ),
      new ethereum.EventParam("delta", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(200))),
      new ethereum.EventParam(
        "deliverable",
        ethereum.Value.fromFixedBytes(
          Bytes.fromHexString("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
        ),
      ),
      new ethereum.EventParam("optParams", ethereum.Value.fromBytes(Bytes.empty())),
    ];

    handleClaimSubmitted(event);

    assert.entityCount("Claim", 0);
    assert.entityCount("JobEvent", 0);
  });
});
