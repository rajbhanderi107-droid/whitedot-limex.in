import "dotenv/config";
export declare const env: {
    readonly DATABASE_URL: string;
    readonly JWT_SECRET: string;
    readonly PORT: number;
    readonly NODE_ENV: "development" | "production" | "test";
    readonly FRONTEND_URL: string;
    readonly FRONTEND_ORIGINS: string[];
    readonly ADMIN_SEED_EMAIL: string;
    readonly ADMIN_SEED_PASSWORD: string | undefined;
    readonly RENDER_EXTERNAL_URL: string | undefined;
    readonly GOOGLE_CLIENT_ID: string;
    readonly GOOGLE_CLIENT_SECRET: string;
    readonly SMTP_HOST: string | undefined;
    readonly SMTP_PORT: number;
    readonly SMTP_SECURE: boolean;
    readonly SMTP_USER: string | undefined;
    readonly SMTP_PASS: string | undefined;
    readonly SMTP_FROM: string;
    readonly LLM_API_KEY: string | undefined;
    readonly LLM_BASE_URL: string;
    readonly LLM_MODEL: string;
    readonly isProduction: boolean;
    readonly smtpConfigured: boolean;
    readonly googleOAuthEnabled: boolean;
    readonly googleCodeOAuthEnabled: boolean;
};
//# sourceMappingURL=env.d.ts.map