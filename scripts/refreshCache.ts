import {customStorageProvider} from '../src/providers/customStorageProvider';
import {refreshCache} from '../src/common/refreshCache';
import {fileSystemStorageAdapter} from '../src/providers/storage/fileSystem';

const provider = customStorageProvider(fileSystemStorageAdapter);

refreshCache(provider);
