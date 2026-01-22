import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyUser } from '@services/basic/index.js'
import { sendError, AppError } from '@core/index.js';
import verifyUserQuery from 'src/dto/verify-user.dto.js';

const verifyUserHandler = async (request: FastifyRequest<{ Querystring: verifyUserQuery }>, reply: FastifyReply) => {
	const { token } = request.query;
	try {
		await verifyUser({ token });
		return reply.status(200).send({
			status: 'success',
			message: 'Email verified successfully. You can now log in.',
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
};

export default verifyUserHandler;
