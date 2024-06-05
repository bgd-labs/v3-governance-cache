import {customStorageProvider} from '../src/providers/customStorageProvider';
import {refreshCache} from '../src/common/refreshCache';
import {fileSystemStorageAdapter} from '../dist/providers/storage/fileSystem';
import {fallbackProvider} from '../dist/providers/fallbackProvider';
import {githubPagesProvider} from '../dist/providers/githubPagesProvider';

const provider = customStorageProvider(fileSystemStorageAdapter);

refreshCache(provider);

// test
// const fb = fallbackProvider(githubPagesProvider, provider);

// fb.getPayload({
//   chainId: 42161,
//   payloadsController: '0x89644CA1bB8064760312AE4F03ea41b05dA3637C',
//   payloadId: 31,
// });
