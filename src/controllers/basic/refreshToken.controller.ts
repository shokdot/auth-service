import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError, AppError } from '@core/index.js';
import { refreshToken as refreshTokenService } from '@services/basic/index.js'

const refreshTokenHandler = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const refreshToken = request.cookies?.refreshToken;

		const { userId, accessToken, refreshToken: newRefreshToken } = await refreshTokenService({ refreshToken });

		reply.setCookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/refresh',
			sameSite: 'strict',
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
			message: 'Token refreshed successfully'
		})

	}
	catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default refreshTokenHandler;
