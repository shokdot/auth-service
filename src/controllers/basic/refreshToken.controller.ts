import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError, AppError } from '@core/index.js';
import { refreshToken as refreshTokenService } from '@services/basic/index.js'

const refreshTokenHandler = async (request: FastifyRequest, reply: FastifyReply) => {
	try {
		const signedRefreshToken = request.cookies?.refreshToken;
		
		if (!signedRefreshToken) {
			throw new AppError('REFRESH_TOKEN_MISSING');
		}

		const unsignResult = request.unsignCookie(signedRefreshToken);
		if (!unsignResult.valid) {
			throw new AppError('INVALID_REFRESH_TOKEN');
		}

		const refreshToken = unsignResult.value;

		const { userId, accessToken, refreshToken: newRefreshToken } = await refreshTokenService({ refreshToken });

		reply.setCookie('refreshToken', newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/refresh',
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
			message: 'Token refreshed successfully'
		})

	}
	catch (error: any) {
		console.log(error);
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default refreshTokenHandler;
