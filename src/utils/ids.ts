import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

export function jobEntityId(contract: Address, jobId: BigInt): Bytes {
  return Bytes.fromUTF8(contract.toHexString() + "-" + jobId.toString());
}

export function scopedAddressId(contract: Address, address: Address): Bytes {
  return contract.concat(address);
}
