import { FastifyReply } from 'fastify';
import { setPass } from '@services/password/index.js'
import { AuthRequest, sendError, AppError } from '@core/index.js';
import setPasswordDTO from 'src/dto/set-password.dto.js';

const setPassHandler = async (request: AuthRequest<setPasswordDTO>, reply: FastifyReply) => {
	try {
		const userId = request.userId;
		const { newPassword } = request.body;
		await setPass(userId, newPassword);

		return reply.status(200).send({
			status: 'success',
			message: 'Password has been set successfully.',
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default setPassHandler;
