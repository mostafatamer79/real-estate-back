import { registerAs } from "@nestjs/config";
import { TypeOrmModule ,TypeOrmModuleOptions} from "@nestjs/typeorm";


export const typeOrmConfig = registerAs(
    "database",
    ():TypeOrmModuleOptions=>({
        type:"postgres",
        host:process.env.DB_HOST ?? 'localhost',
        port:5432,
        username:process.env.DB_USER?? 'postgres',
        password:process.env.DB_PASSWORD?? 'postgres',
        database: process.env.DB_NAME?? "realestate",
        autoLoadEntities: true,
        synchronize:true
    })
)