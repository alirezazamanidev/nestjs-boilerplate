import type { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type TUser = {
    _id: string;
    clientId?: string;
};

/**
 * Custom decorator to extract the authenticated user from the request object.
 *
 * Can be used in controller methods as `@User()` to get the full user object,
 * or `@User('propertyName')` to get a specific property of the user.
 */
export const User = createParamDecorator(
    (
        data: keyof (TUser & { id: string }) | undefined,
        ctx: ExecutionContext,
    ) => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const user = request['user'] as TUser | undefined;

        if (!user) {
            throw new Error(
                'User not found. Possibly using @User() on a public route (route annotated with Public decorator).',
            );
        }

        const userWithId = { id: user._id.toString(), ...user };

        return data ? userWithId[data] : userWithId;
    },
);
