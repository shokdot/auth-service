import { FastifyReply } from 'fastify'
import { sendError, AuthRequest, AppError } from '@core/index.js';
import { twoFaSetup } from '@services/twofa/index.js'

const twoFaSetupHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const userId = request.userId;
		const data = await twoFaSetup({ userId });

		reply.status(200).send({
			status: 'success',
			data,
			message: '2FA setup initialized successfully'
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default twoFaSetupHandler;
