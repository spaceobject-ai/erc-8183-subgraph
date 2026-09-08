import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  BudgetSet,
  AgenticCommerce as AgenticCommerceContract,
  HookDetached,
  JobCompleted,
  JobCreated,
  JobExpired,
  JobFunded,
  JobRejected,
  JobSubmitted,
  PayoutReceiverSet,
  ProviderSet,
} from "../../../generated/AgenticCommerce/AgenticCommerce";
import { Job } from "../../../generated/schema";
import { getOrCreateAccount } from "../../entities/account";
import { getOrCreateAgenticCommerce } from "../../entities/agentic-commerce";
import { createJobEvent, loadJob, touchJob } from "../../entities/job";
import { jobEntityId } from "../../utils/ids";

export function handleJobCreated(event: JobCreated): void {
  const agenticCommerce = getOrCreateAgenticCommerce(event);
  const client = getOrCreateAccount(event.params.client);
  const evaluator = getOrCreateAccount(event.params.evaluator);
  const result = AgenticCommerceContract.bind(event.address).try_getJob(event.params.jobId);

  const job = new Job(jobEntityId(event.address, event.params.jobId));
  job.agenticCommerce = agenticCommerce.id;
  job.jobId = event.params.jobId;
  job.status = "OPEN";
  job.client = client.id;
  job.evaluator = evaluator.id;
  job.expiresAt = event.params.expiredAt.toI64();
  job.budget = BigInt.zero();
  job.providerAgentId = BigInt.zero();
  job.description = "";
  job.settledAmount = BigInt.zero();
  job.providerPayment = BigInt.zero();
  job.platformFeePaid = BigInt.zero();
  job.evaluatorFeePaid = BigInt.zero();
  job.refundedAmount = BigInt.zero();
  job.createdAt = event.block.timestamp.toI64();
  job.createdAtBlock = event.block.number;
  job.createdAtTransaction = event.transaction.hash;
  touchJob(job, event);

  if (!event.params.provider.equals(Address.zero())) {
    job.provider = getOrCreateAccount(event.params.provider).id;
  }
  if (!event.params.hook.equals(Address.zero())) job.hook = event.params.hook;
  if (!result.reverted) {
    job.providerAgentId = result.value.providerAgentId;
    job.description = result.value.description;
    if (!result.value.payoutReceiver.equals(Address.zero())) {
      job.payoutReceiver = getOrCreateAccount(result.value.payoutReceiver).id;
    }
  }
  job.save();

  agenticCommerce.jobCount = agenticCommerce.jobCount.plus(BigInt.fromI32(1));
  agenticCommerce.updatedAt = event.block.timestamp.toI64();
  agenticCommerce.save();

  const record = createJobEvent(event, job, "CREATED");
  record.actor = client.id;
  record.address = event.params.provider;
  record.save();
}

export function handleProviderSet(event: ProviderSet): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  const provider = getOrCreateAccount(event.params.provider);
  job.provider = provider.id;
  job.providerAgentId = event.params.agentId;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "PROVIDER_SET");
  record.actor = provider.id;
  record.address = event.params.provider;
  record.amount = event.params.agentId;
  record.save();
}

export function handlePayoutReceiverSet(event: PayoutReceiverSet): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.payoutReceiver = null;
  if (!event.params.payoutReceiver.equals(Address.zero())) {
    job.payoutReceiver = getOrCreateAccount(event.params.payoutReceiver).id;
  }
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "PAYOUT_RECEIVER_SET");
  record.address = event.params.payoutReceiver;
  record.save();
}

export function handleBudgetSet(event: BudgetSet): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.paymentToken = event.params.token;
  job.budget = event.params.amount;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "BUDGET_SET");
  record.token = event.params.token;
  record.amount = event.params.amount;
  record.save();
}

export function handleJobFunded(event: JobFunded): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.status = "FUNDED";
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "FUNDED");
  record.actor = getOrCreateAccount(event.params.client).id;
  record.amount = event.params.amount;
  record.save();
}

export function handleJobSubmitted(event: JobSubmitted): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.status = "SUBMITTED";
  job.submittedAt = event.block.timestamp.toI64();
  job.deliverable = event.params.deliverable;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "SUBMITTED");
  record.actor = getOrCreateAccount(event.params.provider).id;
  record.data = event.params.deliverable;
  record.save();
}

export function handleJobCompleted(event: JobCompleted): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.status = "COMPLETED";
  job.completionReason = event.params.reason;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "COMPLETED");
  record.actor = getOrCreateAccount(event.params.evaluator).id;
  record.data = event.params.reason;
  record.save();
}

export function handleJobRejected(event: JobRejected): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.status = "REJECTED";
  job.rejectionReason = event.params.reason;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "REJECTED");
  record.actor = getOrCreateAccount(event.params.rejector).id;
  record.data = event.params.reason;
  record.save();
}

export function handleJobExpired(event: JobExpired): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.status = "EXPIRED";
  touchJob(job, event);
  job.save();
  createJobEvent(event, job, "EXPIRED").save();
}

export function handleHookDetached(event: HookDetached): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.hook = null;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "HOOK_DETACHED");
  record.address = event.params.hook;
  record.save();
}
