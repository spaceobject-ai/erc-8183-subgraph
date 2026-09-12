import {
  EmergencyWithdraw,
  EvaluatorFeeUpdated,
  HookWhitelistUpdated,
  Paused,
  PaymentTokenAllowlistUpdated,
  PlatformFeeUpdated,
  Unpaused,
  Upgraded,
} from "../../../generated/AgenticCommerce/AgenticCommerce";
import {
  EmergencyWithdrawal,
  HookAllowlistEntry,
  PaymentTokenAllowlistEntry,
} from "../../../generated/schema";
import { getOrCreateAccount } from "../../entities/account";
import { getOrCreateAgenticCommerce, updatePauseState } from "../../entities/agentic-commerce";

export function handleHookWhitelistUpdated(event: HookWhitelistUpdated): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  // The AgenticCommerce entity ID is already chain-scoped and the hook
  // address is fixed-width, so concatenation alone is a collision-free ID:
  // unlike `jobEntityId` in ../../entities/job.ts, no delimiter is needed
  // before a single fixed-length component.
  const id = agenticCommerce.id.concat(event.params.hook);
  let entry = HookAllowlistEntry.load(id);
  if (entry == null) {
    entry = new HookAllowlistEntry(id);
    entry.agenticCommerce = agenticCommerce.id;
    entry.hook = event.params.hook;
  }
  entry.allowed = event.params.status;
  entry.updatedAt = event.block.timestamp.toI64();
  entry.updatedAtBlock = event.block.number;
  entry.updatedAtTransaction = event.transaction.hash;
  entry.save();

  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}

export function handlePaymentTokenAllowlistUpdated(event: PaymentTokenAllowlistUpdated): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  // Same chain-scoped concatenation scheme as the hook allowlist above.
  const id = agenticCommerce.id.concat(event.params.token);
  let entry = PaymentTokenAllowlistEntry.load(id);
  if (entry == null) {
    entry = new PaymentTokenAllowlistEntry(id);
    entry.agenticCommerce = agenticCommerce.id;
    entry.token = event.params.token;
  }
  entry.allowed = event.params.status;
  entry.updatedAt = event.block.timestamp.toI64();
  entry.updatedAtBlock = event.block.number;
  entry.updatedAtTransaction = event.transaction.hash;
  entry.save();

  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}

export function handlePlatformFeeUpdated(event: PlatformFeeUpdated): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  const treasury = getOrCreateAccount(event.params.treasury);
  agenticCommerce.platformFeeBP = event.params.feeBP;
  agenticCommerce.platformTreasury = treasury.id;
  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}

export function handleEvaluatorFeeUpdated(event: EvaluatorFeeUpdated): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  agenticCommerce.evaluatorFeeBP = event.params.feeBP;
  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}

export function handlePaused(event: Paused): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  updatePauseState(agenticCommerce, true, event.block.timestamp);
  agenticCommerce.save();
}

export function handleUnpaused(event: Unpaused): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  updatePauseState(agenticCommerce, false, event.block.timestamp);
  agenticCommerce.save();
}

export function handleUpgraded(event: Upgraded): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  agenticCommerce.implementation = event.params.implementation;
  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  const record = new EmergencyWithdrawal(event.transaction.hash.concatI32(event.logIndex.toI32()));
  record.agenticCommerce = agenticCommerce.id;
  record.token = event.params.token;
  record.to = getOrCreateAccount(event.params.to).id;
  record.amount = event.params.amount;
  record.blockNumber = event.block.number;
  record.timestamp = event.block.timestamp.toI64();
  record.transactionHash = event.transaction.hash;
  record.save();

  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();
}
