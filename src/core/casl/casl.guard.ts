import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import type { ICaslModuleOptions, TPolicy } from './types';
import { CASL_MODULE_OPTIONS, CHECK_POLICIES_KEY } from './casl.constants';
import {
    Inject,
    Injectable,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class CaslGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly caslFactory: CaslAbilityFactory,
        @Inject(CASL_MODULE_OPTIONS)
        private readonly moduleOptions: ICaslModuleOptions,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const policy = this.reflector.getAllAndOverride<TPolicy>(
            CHECK_POLICIES_KEY,
            [context.getHandler()],
        );
        if (!policy) return true;

        const user = this.moduleOptions.getUser(context);
        if (!user) return false;

        const { action, subject } = policy;
        const ability = this.caslFactory.createForRole(user.role);

        return ability.can(action, subject);
    }
}
