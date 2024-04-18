import {githubHybridCacheAdapter} from '../src/adapter/githubHybrid';
import {localCacheAdapter} from '../src/adapter/localCache';
import {refreshCache} from '../src/common/refreshCache';

refreshCache(githubHybridCacheAdapter(localCacheAdapter));
