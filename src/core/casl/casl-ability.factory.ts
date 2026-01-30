import { Inject, OnModuleInit } from "@nestjs/common";
import { CASL_MODULE_OPTIONS } from "./casl.constants";
import type { ICaslModuleOptions, IRoleDefinition, TAppAbility } from "./types";
import { AbilityBuilder, createMongoAbility } from "@casl/ability";


export class CaslAbilityFactory implements OnModuleInit{
   @Inject(CASL_MODULE_OPTIONS)
    private readonly moduleOptions: ICaslModuleOptions;
    private roles: IRoleDefinition[];

    onModuleInit() {
        this.roles=this.moduleOptions.roles;
    }

    createForRole(roleName:string){
        const role=this.roles.find((r)=>r.name===roleName);
           const { can, cannot, build } = new AbilityBuilder<TAppAbility>(
            createMongoAbility,
        );
        if(!role) throw new Error(`Role "${roleName}" not found!`);
        role.define({can,cannot})
        return build({
            detectSubjectType: (item: any) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
                typeof item === 'string' ? item : item?.constructor,
        });
    }

}