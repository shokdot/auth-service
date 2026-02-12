import { FastifyReply, FastifyRequest } from "fastify";
import { sendError, AppError } from '@core/index.js';
import { oauthLogin } from "@services/oauth/index.js";

declare module "fastify" {
	interface FastifyInstance {
		githubOAuth2: any;
	}
}

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3010';

const oauthLoginHandler = () => {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		try {
			const githubOAuth2 = request.server.githubOAuth2;
			const auth = oauthLogin(githubOAuth2);
			const result = await auth.getUserData(request);

			reply.setCookie('refreshToken', result.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				path: '/api/v1/auth',
				sameSite: 'strict',
				signed: true,
				maxAge: 7 * 24 * 60 * 60
			});

			// Redirect to the frontend callback page.
			// The page will call /api/v1/auth/refresh to obtain an access token
			// using the refreshToken cookie that was just set above.
			return reply.redirect(`${FRONTEND_ORIGIN}/auth/callback`);

		}
		catch (error: any) {
			const errorMsg = error instanceof AppError ? error.code : 'INTERNAL_SERVER_ERROR';
			request.log.error({
				event: 'oauth_login_failed',
				errorCode: errorMsg,
				errorMessage: error?.message,
				errorName: error?.constructor?.name,
				stack: error?.stack,
			}, `OAuth login failed: ${error?.message}`);
			return reply.redirect(`${FRONTEND_ORIGIN}/login?error=${encodeURIComponent(errorMsg)}`);
		}
	};
};

export default oauthLoginHandler;
