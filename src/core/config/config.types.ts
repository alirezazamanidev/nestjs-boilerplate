import { ConfigFactory } from "@nestjs/config"
import { ObjectSchema } from "joi"
import { LoadManifestsOptions } from "../modules/manifest.types";


export type ManifestConfigType ={
  factory?:ConfigFactory,
  schema?:ObjectSchema
}
export type LoadConfigOptions = {
    coreGlob?: string;
    cwd?: string;
    absolute?: boolean; // default true
    forceReload?: boolean;
    manifests?: LoadManifestsOptions;
};
