import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from './cache.interceptor';

export const Cacheable = () => UseInterceptors(CacheInterceptor);
