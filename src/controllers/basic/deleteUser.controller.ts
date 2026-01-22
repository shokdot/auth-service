import { FastifyReply } from "fastify";
import { deleteUser } from "@services/basic/index.js";
import { sendError, AuthRequest, AppError } from '@core/index.js';

const deleteUserHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const { userId, accessToken } = request;
		await deleteUser(userId, accessToken);

		return reply.status(200).send({
			status: 'success',
			message: 'User deleted successfully',
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default deleteUserHandler;
