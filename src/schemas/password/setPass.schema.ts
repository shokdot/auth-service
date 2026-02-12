import { authenticate, errorResponseSchema } from "@core/index.js";
import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";

const setPassSchema: RouteShorthandOptions =
{
	preHandler: [authenticate],
	schema:
	{
		description: "Set password for OAuth users who don't have one",
		tags: ["Password Management"],
		body: {
			type: 'object',
			required: ['newPassword'],
			additionalProperties: false,
			properties: {
				newPassword: { type: 'string' }
			},
		},
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

export default setPassSchema;
