import {
  ClaimApproved,
  ClaimRejected,
  ClaimSettled,
  ClaimSubmitted,
  Settled,
} from "../../../generated/AgenticCommerce/AgenticCommerce";
import { Claim } from "../../../generated/schema";
import { getOrCreateAccount } from "../../entities/account";
import { createJobEvent, loadJob, touchJob } from "../../entities/job";

export function handleClaimSubmitted(event: ClaimSubmitted): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  const provider = getOrCreateAccount(event.params.provider);
  const claim = new Claim(event.transaction.hash.concatI32(event.logIndex.toI32()));
  claim.job = job.id;
  claim.provider = provider.id;
  claim.status = "PENDING";
  claim.cumulativeAmount = event.params.cumulativeAmount;
  claim.delta = event.params.delta;
  claim.deliverable = event.params.deliverable;
  claim.optParams = event.params.optParams;
  claim.createdAt = event.block.timestamp.toI64();
  claim.createdAtBlock = event.block.number;
  claim.createdAtTransaction = event.transaction.hash;
  claim.save();

  job.pendingClaim = claim.id;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "CLAIM_SUBMITTED");
  record.actor = provider.id;
  record.cumulativeAmount = event.params.cumulativeAmount;
  record.delta = event.params.delta;
  record.data = event.params.deliverable;
  record.optParams = event.params.optParams;
  record.save();
}

export function handleClaimSettled(event: ClaimSettled): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  const record = createJobEvent(event, job, "CLAIM_SETTLED");
  record.actor = getOrCreateAccount(event.params.settler).id;
  record.cumulativeAmount = event.params.cumulativeAmount;
  record.delta = event.params.delta;
  record.data = event.params.deliverable;
  record.save();
}

export function handleClaimApproved(event: ClaimApproved): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  const approver = getOrCreateAccount(event.params.approver);
  if (job.pendingClaim) {
    const claim = Claim.load(job.pendingClaim!);
    if (claim) {
      claim.status = "APPROVED";
      claim.resolver = approver.id;
      claim.resolvedAt = event.block.timestamp.toI64();
      claim.resolvedAtBlock = event.block.number;
      claim.resolvedAtTransaction = event.transaction.hash;
      claim.save();
    }
  }
  job.pendingClaim = null;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "CLAIM_APPROVED");
  record.actor = approver.id;
  record.cumulativeAmount = event.params.cumulativeAmount;
  record.delta = event.params.delta;
  record.data = event.params.deliverable;
  record.save();
}

export function handleClaimRejected(event: ClaimRejected): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  const rejector = getOrCreateAccount(event.params.rejector);
  if (job.pendingClaim) {
    const claim = Claim.load(job.pendingClaim!);
    if (claim) {
      claim.status = "REJECTED";
      claim.resolver = rejector.id;
      claim.resolutionReason = event.params.reason;
      claim.resolvedAt = event.block.timestamp.toI64();
      claim.resolvedAtBlock = event.block.number;
      claim.resolvedAtTransaction = event.transaction.hash;
      claim.save();
    }
  }
  job.pendingClaim = null;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "CLAIM_REJECTED");
  record.actor = rejector.id;
  record.data = event.params.reason;
  record.save();
}

export function handleSettled(event: Settled): void {
  const job = loadJob(event.address, event.params.jobId);
  if (job == null) return;
  job.settledAmount = event.params.cumulativeAmount;
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "SETTLED");
  record.cumulativeAmount = event.params.cumulativeAmount;
  record.delta = event.params.delta;
  record.save();
}
