import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError, AppError } from '@core/index.js';
import { forgotPass } from '@services/password/index.js'
import forgotPasswordDTO from 'src/dto/forgot-password.dto.js';

const forgotPassHandler = async (request: FastifyRequest<{ Body: forgotPasswordDTO }>, reply: FastifyReply) => {
	try {
		const { email } = request.body;
		await forgotPass(email);

		return reply.status(200).send({
			status: 'success',
			message: 'Reset link successfuly send to your email',
		});


	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default forgotPassHandler;
