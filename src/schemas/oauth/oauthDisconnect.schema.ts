import { authenticate, errorResponseSchema } from "@core/index.js";
import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";

const oauthDisconnectSchema: RouteShorthandOptions =
{
	preHandler: [authenticate],
	schema:
	{
		description: "Disconnect GitHub account",
		tags: ["OAuth"],
		response: {
			200: {
				type: 'object',
				required: ['status', 'message'],
				additionalProperties: false,
				properties: {
					status: { type: 'string', enum: ['success'] },
					message: { type: 'string' }
				},
			},
			400: errorResponseSchema,
			401: errorResponseSchema,
			404: errorResponseSchema,
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

export default oauthDisconnectSchema;
