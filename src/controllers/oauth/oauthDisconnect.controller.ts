import { FastifyReply } from 'fastify';
import { oauthDisconnect } from '@services/oauth/index.js';
import { AuthRequest, sendError, AppError } from '@core/index.js';

const oauthDisconnectHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const userId = request.userId;
		await oauthDisconnect(userId);

		return reply.status(200).send({
			status: 'success',
			message: 'GitHub account has been disconnected.',
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default oauthDisconnectHandler;
