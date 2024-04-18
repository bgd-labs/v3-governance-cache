import { type Address, type GetLogsReturnType } from "viem";
import type { AbiEvent } from "abitype";

type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export type LogWithTimestamp<
  TAbiEvent extends AbiEvent | undefined = undefined,
  TAbiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = TAbiEvent extends AbiEvent ? [TAbiEvent] : undefined
> = ArrayElement<GetLogsReturnType<TAbiEvent, TAbiEvents>> & {
  timestamp: number;
};

export interface GovernanceCacheAdapter {
  syncPayloadsCache?: (args: {
    chainId: number;
    payloadsController: Address;
  }) => any;
  syncProposalCache?: (args: { chainId: number; governance: Address }) => any;
  getPayload: (args: {
    chainId: number;
    payloadsController: Address;
    payloadId: number;
  }) => void;
  getProposal: (args: {
    chainId: number;
    governance: Address;
    proposalId: number;
  }) => void;
}
