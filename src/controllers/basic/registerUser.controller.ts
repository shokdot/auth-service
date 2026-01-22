import { FastifyRequest, FastifyReply } from 'fastify';
import { registerUser } from '@services/basic/index.js'
import { sendError, AppError } from '@core/index.js';
import registerDTO from 'src/dto/register.dto.js';

const registerUserHandler = async (request: FastifyRequest<{ Body: registerDTO }>, reply: FastifyReply) => {
	try {
		const { body } = request;
		const user = await registerUser(body);

		return reply.status(201).send({
			status: 'success',
			data: {
				userId: user.id,
				email: user.email,
				username: user.username
			},
			message: 'User registered successfully'

		});
	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default registerUserHandler;
