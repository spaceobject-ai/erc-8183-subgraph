import {
  Disbursed,
  EvaluatorFeePaid,
  PaymentReleased,
  PlatformFeePaid,
  Refunded,
} from "../../../generated/AgenticCommerce/AgenticCommerce";
import { getOrCreateAccount } from "../../entities/account";
import { contextChainId } from "../../entities/agentic-commerce";
import { createJobEvent, getJob, jobEntityId, touchJob } from "../../entities/job";

export function handlePaymentReleased(event: PaymentReleased): void {
  const job = getJob(jobEntityId(contextChainId(), event.address, event.params.jobId));
  if (job == null) return;
  job.providerPayment = job.providerPayment.plus(event.params.amount);
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "PAYMENT_RELEASED");
  record.actor = getOrCreateAccount(event.params.recipient).id;
  record.amount = event.params.amount;
  record.save();
}

export function handlePlatformFeePaid(event: PlatformFeePaid): void {
  const job = getJob(jobEntityId(contextChainId(), event.address, event.params.jobId));
  if (job == null) return;
  job.platformFeePaid = job.platformFeePaid.plus(event.params.amount);
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "PLATFORM_FEE_PAID");
  record.actor = getOrCreateAccount(event.params.platformTreasury).id;
  record.amount = event.params.amount;
  record.save();
}

export function handleEvaluatorFeePaid(event: EvaluatorFeePaid): void {
  const job = getJob(jobEntityId(contextChainId(), event.address, event.params.jobId));
  if (job == null) return;
  job.evaluatorFeePaid = job.evaluatorFeePaid.plus(event.params.amount);
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "EVALUATOR_FEE_PAID");
  record.actor = getOrCreateAccount(event.params.evaluator).id;
  record.amount = event.params.amount;
  record.save();
}

export function handleRefunded(event: Refunded): void {
  const job = getJob(jobEntityId(contextChainId(), event.address, event.params.jobId));
  if (job == null) return;
  job.refundedAmount = job.refundedAmount.plus(event.params.amount);
  touchJob(job, event);
  job.save();

  const record = createJobEvent(event, job, "REFUNDED");
  record.actor = getOrCreateAccount(event.params.client).id;
  record.amount = event.params.amount;
  record.save();
}

export function handleDisbursed(event: Disbursed): void {
  const job = getJob(jobEntityId(contextChainId(), event.address, event.params.jobId));
  if (job == null) return;
  const record = createJobEvent(event, job, "DISBURSED");
  record.actor = getOrCreateAccount(event.params.receiver).id;
  record.selector = event.params.selector;
  record.amount = event.params.amount;
  record.save();
}
