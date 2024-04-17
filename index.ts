import { CHAIN_ID_CLIENT_MAP, mainnetClient } from "@bgd-labs/js-utils";
import { GovernanceV3Ethereum } from "@bgd-labs/aave-address-book";
import type { Address, Client } from "viem";
import { cacheGovernance, cachePayloadsController } from "./src/updateCache";

// 1. cache governance
const cache = await cacheGovernance(mainnetClient as Client, GovernanceV3Ethereum.GOVERNANCE)
const payloadsController = new Map<string, {chainId: number, controller: Address}>();
Object.keys(cache.proposalsCache).map(key => {
    const proposal = cache.proposalsCache[key];
    proposal.payloads.map(payload => payloadsController.set(`${Number(payload.chain)}:${payload.payloadsController}`, {chainId: Number(payload.chain), controller: payload.payloadsController}))
})
// 2. cache each unique controller ever touched by governance
for (const [,{chainId,controller}] of payloadsController) {
    await cachePayloadsController(CHAIN_ID_CLIENT_MAP[chainId], controller);
}