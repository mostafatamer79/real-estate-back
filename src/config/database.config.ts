import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";


export const typeOrmConfig = registerAs(
    "database",
    (): TypeOrmModuleOptions => {
        const isProduction = process.env.NODE_ENV === "production";
        const sslEnabled = process.env.DB_SSL === "true";
        const synchronizeOverride = process.env.DB_SYNCHRONIZE;
        const synchronize =
            synchronizeOverride === undefined
                ? !isProduction
                : synchronizeOverride === "true";

        return {
            type: "postgres",
            host: process.env.DB_HOST ?? "localhost",
            port: parseInt(process.env.DB_PORT || "5432", 10),
            username: process.env.DB_USER ?? "postgres",
            password: process.env.DB_PASSWORD ?? "postgres",
            database: process.env.DB_NAME ?? "realestate",
            autoLoadEntities: true,
            synchronize,
            ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
    },
);
