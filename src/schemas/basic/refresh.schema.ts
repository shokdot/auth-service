import { errorResponseSchema } from "@core/index.js";
import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";

const refreshSchema: RouteShorthandOptions =
{
	schema:
	{
		description: "Refresh access token using refresh token cookie",
		tags: ["Auth"],
		response: {
			200: {
				type: 'object',
				required: ['status', 'data', 'message'],
				additionalProperties: false,
				properties: {
					status: { type: 'string', enum: ['success'] },
					data: {
						type: 'object',
						required: ['userId', 'accessToken', 'tokenType', 'expiresIn'],
						properties: {
							userId: { type: 'string', format: 'uuid', description: 'User ID' },
							accessToken: { type: 'string' },
							tokenType: { type: 'string' },
							expiresIn: { type: 'number' }
						}
					},
					message: { type: 'string' }
				},
			},
			401: errorResponseSchema,
			403: errorResponseSchema,
			500: errorResponseSchema
		}
	},
	config: {
		rateLimit: {
			max: 5,
			timeWindow: '1 minute'
		}
	}
};

export default refreshSchema;
