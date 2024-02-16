import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';

@Injectable()
export class AuthCache {
    private cache: NodeCache;
    constructor() {
        this.cache = new NodeCache();
    }

    async createCache(params: any) {
        let { props } = params
        let { userId, mobileNo, authEmailNo, authMobileNo, authType } = props

        let cacheKey           // 캐시 키
        let chcheValue         // 캐시 값
        if (authType === 'email') {
            cacheKey = userId
            chcheValue = authEmailNo
        } else {
            cacheKey = mobileNo
            chcheValue = authMobileNo
        }

        const isSuccess = this.cache.set(cacheKey, chcheValue, 60 * 3);
        // set('cache 키', 'cache 값', 만료시간(sec))

        return isSuccess;
    }

    async checkCache(params: any) {
        let { props } = params
        let { userId, mobileNo, authEmailNo, authMobileNo, authType } = props

        const cacheKey = authType === 'email' ? userId : mobileNo;

        let value = this.cache.get<string>(cacheKey);
        return value;
    }

}
