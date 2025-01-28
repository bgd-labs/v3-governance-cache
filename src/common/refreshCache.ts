import {
  GovernanceV3Ethereum,
  GovernanceV3Arbitrum,
  GovernanceV3Avalanche,
  GovernanceV3Metis,
  GovernanceV3Optimism,
  GovernanceV3Gnosis,
  GovernanceV3BNB,
  GovernanceV3Polygon,
  GovernanceV3PolygonZkEvm,
  GovernanceV3Scroll,
  GovernanceV3Base,
  GovernanceV3ZkSync,
  GovernanceV3Linea,
} from '@bgd-labs/aave-address-book';
import type {GovernanceCacheAdapterWithSync} from '..';

export async function refreshCache(adapter: GovernanceCacheAdapterWithSync) {
  await adapter.syncProposalCache({
    chainId: 1,
    governance: GovernanceV3Ethereum.GOVERNANCE,
  });

  [
    GovernanceV3Ethereum,
    GovernanceV3Arbitrum,
    GovernanceV3Avalanche,
    GovernanceV3Metis,
    GovernanceV3Optimism,
    GovernanceV3Gnosis,
    GovernanceV3BNB,
    GovernanceV3Polygon,
    GovernanceV3PolygonZkEvm,
    GovernanceV3Scroll,
    GovernanceV3Base,
    GovernanceV3ZkSync,
    GovernanceV3Linea,
  ].map(({PAYLOADS_CONTROLLER, CHAIN_ID}) => {
    return adapter.syncPayloadsCache({
      chainId: CHAIN_ID,
      payloadsController: PAYLOADS_CONTROLLER,
    });
  });
}
