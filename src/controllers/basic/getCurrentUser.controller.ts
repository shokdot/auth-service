import { FastifyReply } from 'fastify';
import { AuthRequest, sendError, AppError } from '@core/index.js';
import { getCurrentUser } from '@services/basic/index.js';

const getCurrentUserHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const { userId } = request;
		const data = await getCurrentUser({ userId });

		reply.status(200).send({
			status: 'success',
			data,
			message: 'Successfully sent data'
		});

	}
	catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default getCurrentUserHandler;
