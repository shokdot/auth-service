import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError, AppError } from '@core/index.js';
import { resetPass } from '@services/password/index.js'
import resetPasswordDTO from 'src/dto/reset-password.dto.js';

const resetPassHandler = async (request: FastifyRequest<{ Body: resetPasswordDTO }>, reply: FastifyReply) => {
	try {
		const { token, password } = request.body;
		await resetPass(token, password);

		return reply.status(200).send({
			status: 'success',
			message: 'Password has been reset successfully.',
		});


	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default resetPassHandler;
