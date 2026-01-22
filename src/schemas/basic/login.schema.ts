import { errorResponseSchema } from "@core/index.js";
import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";

const loginSchema: RouteShorthandOptions =
{
	schema:
	{
		description: "Login user with email and password",
		tags: ["Auth"],
		body: {
			type: 'object',
			required: ['email', 'password'],
			additionalProperties: false,
			properties: {
				email: {
					type: 'string',
					format: 'email',
					description: 'Email of user'
				},
				password: {
					type: 'string',
					minLength: 6,
					description: 'User password',
				},
			},
		},
		response: {
			200: {
				oneOf: [
					{
						type: 'object',
						additionalProperties: false,
						required: ['status', 'data', 'message'],
						properties: {
							status: { type: 'string', enum: ['success'] },
							data: {
								type: 'object',
								required: ['userId', 'accessToken', 'tokenType', 'expiresIn'],
								additionalProperties: false,
								properties: {
									userId: { type: 'string', format: 'uuid', description: 'User ID' },
									accessToken: { type: 'string' },
									tokenType: { type: 'string' },
									expiresIn: { type: 'number' },
								}
							},
							message: { type: 'string' },
						}
					},
					{
						type: 'object',
						additionalProperties: false,
						required: ['status', 'data', 'message'],
						properties: {
							status: { type: 'string', enum: ['pending'] },
							data: {
								type: 'object',
								required: ['userId', 'twoFactorRequired', 'twoFaToken'],
								additionalProperties: false,
								properties: {
									userId: { type: 'string', format: 'uuid', description: 'User ID' },
									twoFactorRequired: { type: 'boolean' },
									twoFaToken: { type: 'string' },
								}
							},
							message: { type: 'string' },
						}
					}
				]
			},
			400: errorResponseSchema,
			401: errorResponseSchema,
			403: errorResponseSchema,
			500: errorResponseSchema,
		},
	},
	config: {
		rateLimit: {
			max: 5,
			timeWindow: '1 minute'
		}
	}
};

export default loginSchema;
