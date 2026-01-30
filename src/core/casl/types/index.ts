import { ExecutionContext } from '@nestjs/common';
import { AbilityBuilder, MongoAbility, SubjectType } from '@casl/ability';

export type TAction =
    | 'manage'
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | (string & {});

export type TSubject = SubjectType;

export type TAppAbility = MongoAbility<[TAction, TSubject]>;

export type TPolicy = {
    action: TAction;
    subject: TSubject;
};

export interface IRoleDefinition {
    name: string;
    define: (
        builder: Pick<AbilityBuilder<TAppAbility>, 'can' | 'cannot'>,
    ) => void;
}

export interface ICaslModuleOptions {
    roles: IRoleDefinition[];
    getUser: (ctx: ExecutionContext) => { role: string };
}

export interface ICaslModuleAsyncOptions {
    useFactory: (
        ...args: any[]
    ) => Promise<ICaslModuleOptions> | ICaslModuleOptions;
    inject?: any[];
}
