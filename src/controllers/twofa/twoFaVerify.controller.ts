import { FastifyReply } from "fastify";
import { AuthRequest, sendError, AppError } from "@core/index.js";
import { twoFaVerify } from "@services/twofa/index.js";
import twoFaDTO from "src/dto/twofa.dto.js";

const twoFaVerifyHandler = async (request: AuthRequest<twoFaDTO>, reply: FastifyReply) => {
	try {
		const { token, session_token } = request.body;
		const { userId, accessToken, refreshToken } = await twoFaVerify({ token, session_token });

		reply.setCookie('refreshToken', refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/api/v1/auth',
			sameSite: 'strict',
			signed: true,
			maxAge: 7 * 24 * 60 * 60
		});

		return reply.status(200).send({
			status: 'success',
			data: {
				userId,
				accessToken,
				tokenType: 'Bearer',
				expiresIn: 900
			},
			message: 'Login successful'
		});

	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default twoFaVerifyHandler;
