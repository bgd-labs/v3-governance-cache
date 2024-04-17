import { mainnetClient } from "@bgd-labs/js-utils";
import { GovernanceV3Ethereum } from "@bgd-labs/aave-address-book";
import type { Client } from "viem";
import { cacheGovernance } from "./src/updateCache";

await cacheGovernance(mainnetClient as Client, GovernanceV3Ethereum.GOVERNANCE)