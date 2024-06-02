import {customStorageProvider} from '../src/providers/customStorageProvider';
import {refreshCache} from '../src/common/refreshCache';
import {fileSystemStorage} from '../dist/fileSystem';

const provider = customStorageProvider(fileSystemStorage);

refreshCache(provider);
