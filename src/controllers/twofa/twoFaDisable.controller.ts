import { FastifyReply } from 'fastify'
import { sendError, AuthRequest, AppError } from '@core/index.js';
import { twoFaDisable } from '@services/twofa/index.js';

const twoFaDisableHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const { userId } = request;
		await twoFaDisable({ userId });

		return reply.status(200).send({
			status: 'success',
			message: '2FA disabled successfully.'
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}


export default twoFaDisableHandler;
