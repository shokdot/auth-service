import { FastifyReply } from 'fastify';
import { changePass } from '@services/password/index.js'
import { AuthRequest, sendError, AppError } from '@core/index.js';
import changePasswordDTO from 'src/dto/change-password.dto.js';

const changePassHandler = async (request: AuthRequest<changePasswordDTO>, reply: FastifyReply) => {
	try {
		const userId = request.userId;
		const { oldPassword, newPassword } = request.body;
		await changePass(userId, oldPassword, newPassword);

		return reply.status(200).send({
			status: 'success',
			message: 'Password has been changed successfully.',
		});


	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default changePassHandler;
