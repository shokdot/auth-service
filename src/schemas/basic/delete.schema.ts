import { RouteShorthandOptions } from "fastify";
import { errorResponseSchema, authenticate } from '@core/index.js';

const deleteUserSchema: RouteShorthandOptions =
{
	preHandler: [authenticate],
	schema:
	{
		description: "Delete current user",
		tags: ["Auth"],
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

			401: errorResponseSchema,
			403: errorResponseSchema,
			404: errorResponseSchema,
			500: errorResponseSchema
		},
	},
};

export default deleteUserSchema;
