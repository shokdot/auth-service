import { RouteShorthandOptions } from "fastify";
import "@fastify/rate-limit";
import { authenticate, errorResponseSchema } from "@core/index.js";

const twoFaSetupSchema: RouteShorthandOptions =
{
	preHandler: [authenticate],
	schema:
	{
		description: "Enable 2FA authentication. Required authentication token",
		tags: ["2FA"],
		response: {
			200: {
				type: 'object',
				required: ['status', 'data', 'message'],
				additionalProperties: false,
				properties: {
					status: { type: 'string', enum: ['success'] },
					data: {
						type: 'object',
						required: ['userId', 'qrCodeDataURL'],
						additionalProperties: false,
						properties: {
							userId: { type: 'string' },
							qrCodeDataURL: { type: 'string' }
						}
					},
					message: { type: 'string' }
				},
			},
			400: errorResponseSchema,
			404: errorResponseSchema,
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

export default twoFaSetupSchema;
