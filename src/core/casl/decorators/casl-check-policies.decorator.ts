import { SetMetadata } from '@nestjs/common';
import { TAction, TSubject } from '../types';
import { CHECK_POLICIES_KEY } from '../casl.constants';

export const CheckPolicies = (action: TAction, subject: TSubject) =>
    SetMetadata(CHECK_POLICIES_KEY, { action, subject });
