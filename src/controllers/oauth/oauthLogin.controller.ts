import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, AppError } from '@core/index.js';
import { oauthLogin } from "@services/oauth/index.js";

declare module "fastify" {
	interface FastifyInstance {
		githubOAuth2: any;
	}
}

const oauthLoginHandler = () => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const githubOAuth2 = request.server.githubOAuth2;
			const auth = oauthLogin(githubOAuth2);
			const result = await auth.getUserData(request);

			reply.setCookie('refreshToken', result.refreshToken, {
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
					userId: result.userId,
					accessToken: result.accessToken,
					tokenType: 'Bearer',
					expiresIn: 900,
				},
				message: 'Login successful',
			});

		}
		catch (error: any) {
			if (error instanceof AppError) {
				return sendError(reply, error);
			}
			return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
		}
	};
};

export default oauthLoginHandler;
