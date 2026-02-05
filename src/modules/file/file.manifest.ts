import { ModuleManifest } from "src/core/modules/manifest.types";


export const manifest:ModuleManifest={
    id:'file',
    title:'File',
    priority:20,
    enabledByDefault:true,
    getModule: async () => (await import('./file.module.js')).FileModule,
    config:{

    },
    db:{
        entities: ['dist/modules/file/entities/*.js'],
        migrations: ['dist/modules/file/database/migrations/*.js'],
        seeders: ['dist/modules/file/database/seeders/*.js'],
        factories: ['dist/modules/file/database/factories/*.js'],
    },
    tags: ['file', 'media', 'storage'],

}