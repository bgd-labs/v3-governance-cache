import type {GovernanceCacheAdapter} from '..';
import {ISSUES_FETCHING_PAYLOAD, ISSUES_FETCHING_PROPOSAL} from '../errors';

export const fallbackProvider = <T extends GovernanceCacheAdapter>(
  ...providers: T[]
): GovernanceCacheAdapter => ({
  async getPayload(args) {
    for (let i = 0; i < providers.length; i++) {
      try {
        const response = await providers[i].getPayload(args);
        return response;
      } catch (e) {
        console.log(e);
        console.log('falling back to next provider');
      }
    }
    throw new Error(ISSUES_FETCHING_PAYLOAD);
  },
  async getProposal(args) {
    for (let i = 0; i < providers.length; i++) {
      try {
        const response = await providers[i].getProposal(args);
        return response;
      } catch (e) {
        console.log(e);
        console.log('falling back to next provider');
      }
    }
    throw new Error(ISSUES_FETCHING_PROPOSAL);
  },
});
