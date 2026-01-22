import { FastifyReply } from "fastify";
import { twoFaConfirm } from "@services/twofa/index.js";
import { AuthRequest, sendError, AppError } from "@core/index.js";
import twoFaDTO from "src/dto/twofa.dto.js";

const twoFaConfirmHandler = async (request: AuthRequest<twoFaDTO>, reply: FastifyReply) => {
	try {
		const { token } = request.body;
		const userId = request.userId;

		await twoFaConfirm({ token, userId });

		reply.status(200).send({
			status: 'success',
			data: { userId },
			message: '2FA enabled successfully'
		});
	}
	catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default twoFaConfirmHandler;
