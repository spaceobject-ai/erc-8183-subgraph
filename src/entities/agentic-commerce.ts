import { Address, BigInt, Bytes, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { AgenticCommerce as AgenticCommerceContract } from "../../generated/AgenticCommerce/AgenticCommerce";
import { AgenticCommerce } from "../../generated/schema";
import { getOrCreateAccount } from "./account";

/**
 * Builds the `AgenticCommerce` entity ID: UTF-8 bytes of
 * "<chainId>:<contract address>" (schema.graphql's `AgenticCommerce`
 * comment). The chain ID makes the ID globally unique when the contract is
 * deployed at the same address on several chains, matching the ERC-8004
 * subgraph's chain-scoped ID scheme so cross-deployment consumers never
 * collide on byte-identical IDs.
 *
 * The parts are joined with ":" rather than concatenated as raw bytes:
 * `chainId` is a variable-length decimal string, so a delimiter keeps the
 * encoding unambiguous. The result also reads as a CAIP-10-style account ID.
 */
export function agenticCommerceEntityId(chainId: BigInt, address: Address): Bytes {
  return Bytes.fromUTF8(chainId.toString() + ":" + address.toHexString());
}

/**
 * The `chainId` context value set for the AgenticCommerce data source in
 * subgraph.template.yaml; `AgenticCommerce` and `Job` entity IDs are
 * chain-scoped.
 */
export function contextChainId(): BigInt {
  return dataSource.context().getBigInt("chainId");
}

export function getOrCreateAgenticCommerce(event: ethereum.Event): AgenticCommerce {
  const chainId = contextChainId();
  const id = agenticCommerceEntityId(chainId, event.address);
  let agenticCommerce = AgenticCommerce.load(id);
  if (agenticCommerce != null) return agenticCommerce;

  agenticCommerce = new AgenticCommerce(id);
  agenticCommerce.network = dataSource.network();
  agenticCommerce.chainId = chainId;
  agenticCommerce.paused = false;
  agenticCommerce.platformFeeBP = BigInt.zero();
  agenticCommerce.evaluatorFeeBP = BigInt.zero();
  agenticCommerce.jobCount = BigInt.zero();
  agenticCommerce.createdAt = event.block.timestamp.toI64();
  agenticCommerce.updatedAt = event.block.timestamp.toI64();

  const treasury = AgenticCommerceContract.bind(event.address).try_platformTreasury();
  if (!treasury.reverted && !treasury.value.equals(Address.zero())) {
    agenticCommerce.platformTreasury = getOrCreateAccount(treasury.value).id;
  }

  agenticCommerce.save();
  return agenticCommerce;
}

export function updatePauseState(
  agenticCommerce: AgenticCommerce,
  paused: boolean,
  timestamp: BigInt,
): void {
  agenticCommerce.paused = paused;
  agenticCommerce.updatedAt = timestamp.toI64();
}
