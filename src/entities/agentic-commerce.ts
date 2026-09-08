import { Address, BigInt, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { AgenticCommerce as AgenticCommerceContract } from "../../generated/AgenticCommerce/AgenticCommerce";
import { AgenticCommerce } from "../../generated/schema";
import { getOrCreateAccount } from "./account";

export function getOrCreateAgenticCommerce(event: ethereum.Event): AgenticCommerce {
  let agenticCommerce = AgenticCommerce.load(event.address);
  if (agenticCommerce != null) return agenticCommerce;

  agenticCommerce = new AgenticCommerce(event.address);
  agenticCommerce.network = dataSource.network();
  agenticCommerce.chainId = dataSource.context().getBigInt("chainId");
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
