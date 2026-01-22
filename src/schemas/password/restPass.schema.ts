import { errorResponseSchema } from "@core/index.js";
import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";

const resetPassSchema: RouteShorthandOptions = {
	schema:
	{
		description: "Reset Password request",
		tags: ["Password Management"],
		body: {
			type: 'object',
			required: ['token', 'password'],
			additionalProperties: false,
			properties: {
				token: { type: 'string', },
				password: { type: 'string' }
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
			500: errorResponseSchema
		},
	},
	config: {
		rateLimit: {
			max: 5,
			timeWindow: '1 minute'
		}
	}
};

export default resetPassSchema;
