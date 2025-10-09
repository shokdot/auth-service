import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().default(3000),
	HOST: z.string().default("0.0.0.0"),
	USER_SERVICE_URL: z.string()
});

const env = envSchema.parse(process.env);

export const PORT = env.PORT;
export const HOST = env.HOST;
export const USER_SERVICE_URL = env.USER_SERVICE_URL;
export const SERVICE_NAME = 'AUTH_SERVICE';
