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
} from "@bgd-labs/aave-address-book";
import { localCacheAdapter } from "../src/adapter/localCache";

await localCacheAdapter.syncProposalCache!({
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
].map(({ PAYLOADS_CONTROLLER, CHAIN_ID }) => {
  return localCacheAdapter.syncPayloadsCache!({
    chainId: CHAIN_ID,
    payloadsController: PAYLOADS_CONTROLLER,
  });
});
