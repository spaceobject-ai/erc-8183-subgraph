import { Address, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { Job, JobEvent } from "../../generated/schema";

/**
 * Builds the `Job` entity ID: UTF-8 bytes of
 * "<chainId>:<contract address>:<jobId>" (schema.graphql's `Job` comment).
 * Same chain ID and ":" reasoning as `agenticCommerceEntityId` in
 * ./agentic-commerce.ts: `chainId` and `jobId` are variable-length decimal
 * strings, so a delimiter keeps the encoding unambiguous.
 */
export function jobEntityId(chainId: BigInt, contract: Address, jobId: BigInt): Bytes {
  return Bytes.fromUTF8(chainId.toString() + ":" + contract.toHexString() + ":" + jobId.toString());
}

/**
 * Loads a `Job` by entity ID (build it with `jobEntityId`), logging a warning
 * when the job was never created so handlers can simply return.
 */
export function getJob(id: Bytes): Job | null {
  const job = Job.load(id);
  if (job == null) log.warning("Event for unknown job {}", [id.toString()]);
  return job;
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
