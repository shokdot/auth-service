import { FastifyReply } from "fastify";
import { logoutUser } from "@services/basic/index.js";
import { sendError, AuthRequest, AppError } from '@core/index.js';

const logoutUserHandler = async (request: AuthRequest, reply: FastifyReply) => {
	try {
		const accessToken = request.accessToken;
		const signedRefreshToken = request.cookies?.refreshToken;
		
		let refreshToken: string | undefined;
		if (signedRefreshToken) {
			const unsignResult = request.unsignCookie(signedRefreshToken);
			refreshToken = unsignResult.valid ? unsignResult.value : undefined;
		}
		
		await logoutUser({ accessToken, refreshToken });

		reply.clearCookie('refreshToken', {
			path: '/refresh',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
		});

		return reply.status(200).send({
			status: 'success',
			message: 'Logout successful',
		});
	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default logoutUserHandler;
