import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Job, JobEvent } from "../../generated/schema";
import { jobEntityId } from "../utils/ids";

export function loadJob(contract: Address, jobId: BigInt): Job | null {
  const job = Job.load(jobEntityId(contract, jobId));
  if (job != null) return job;
  log.warning("Event for unknown job {} on Agentic Commerce contract {}", [
    jobId.toString(),
    contract.toHexString(),
  ]);
  return null;
}

export function touchJob(job: Job, event: ethereum.Event): void {
  job.updatedAt = event.block.timestamp.toI64();
  job.updatedAtBlock = event.block.number;
  job.updatedAtTransaction = event.transaction.hash;
}

export function createJobEvent(event: ethereum.Event, job: Job, kind: string): JobEvent {
  const record = new JobEvent(event.transaction.hash.concatI32(event.logIndex.toI32()));
  record.agenticCommerce = job.agenticCommerce;
  record.job = job.id;
  record.kind = kind;
  record.blockNumber = event.block.number;
  record.timestamp = event.block.timestamp.toI64();
  record.transactionHash = event.transaction.hash;
  record.logIndex = event.logIndex;
  return record;
}
