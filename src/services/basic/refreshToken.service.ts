import { JwtType, verifyJwt, AppError } from '@core/index.js';
import prisma from "src/utils/prismaClient.js";
import generateJwtTokens from 'src/utils/generateJwtTokens.js';

const refreshToken = async ({ refreshToken }) => {

	if (!refreshToken) {
		throw new AppError('REFRESH_TOKEN_MISSING');
	}

	const decoded = verifyJwt(refreshToken, JwtType.REFRESH);
	if (!decoded) {
		throw new AppError('INVALID_REFRESH_TOKEN');
	}

	const { sub: userId, tokenId } = decoded;

	const tokenRecord = await prisma.refreshToken.findUnique({ where: { id: tokenId } });

	if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
		throw new AppError('INVALID_REFRESH_TOKEN');
	}

	await prisma.refreshToken.update({
		where: { id: tokenId },
		data: { revoked: true },
	});

	const tokens = await generateJwtTokens(userId);


	return ({ userId: decoded.sub, ...tokens });

}

export default refreshToken;
