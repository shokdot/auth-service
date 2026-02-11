import { FastifyRequest, FastifyReply } from 'fastify';
import { sendError, AppError } from '@core/index.js';
import loginDTO from 'src/dto/login.dto.js';
import { loginUser } from '@services/basic/index.js'

const loginUserHandler = async (request: FastifyRequest<{ Body: loginDTO }>, reply: FastifyReply) => {
	try {
		const result: any = await loginUser(request.body);

		if ('twoFactorRequired' in result && result.twoFactorRequired) {
			return reply.status(200).send({
				status: 'pending',
				data: result,
				message: 'Two-factor authentication required',
			});
		}

		reply.setCookie('refreshToken', result.refreshToken, {
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
				userId: result.userId,
				accessToken: result.accessToken,
				tokenType: 'Bearer',
				expiresIn: 900,
			},
			message: 'Login successful',
		});


	} catch (error: any) {
		if (error instanceof AppError) {
			return sendError(reply, error);
		}
		return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
	}
}

export default loginUserHandler;
