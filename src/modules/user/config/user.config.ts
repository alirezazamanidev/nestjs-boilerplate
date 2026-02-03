import { registerAs } from "@nestjs/config";


export const UserConfig=registerAs('user',()=>({
    username:'alireza',
    fullname:'zamani'
}))