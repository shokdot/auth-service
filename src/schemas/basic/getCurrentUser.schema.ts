import { RouteShorthandOptions } from "fastify";
import { authenticate, errorResponseSchema } from "@core/index.js";

const getCurrentUserSchema: RouteShorthandOptions =
{
	preHandler: [authenticate],
	schema:
	{
		description: "Get information about current user",
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
						required: ['userId', 'email', 'isEmailVerified', 'createdAt', 'updatedAt'],
						properties: {
							userId: { type: 'string', format: 'uuid', },
							email: { type: 'string', format: 'email' },
							isEmailVerified: { type: 'boolean' },
							createdAt: { type: 'string' },
							updatedAt: { type: 'string' }
						}
					},
					message: { type: 'string' }
				},
			},
			401: errorResponseSchema,
			403: errorResponseSchema,
			404: errorResponseSchema,
			500: errorResponseSchema
		},
	}
};

export default getCurrentUserSchema;
