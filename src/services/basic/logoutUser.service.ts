import { JwtType, verifyJwt } from '@core/index.js';
import prisma from "src/utils/prismaClient.js";

const logoutUser = async ({ accessToken, refreshToken }) => {
	if (!refreshToken)
		return;

	if (!accessToken)
		return;

	try {
		const payload = verifyJwt(refreshToken, JwtType.REFRESH);
		if (!payload || !payload.tokenId) return;

		await prisma.refreshToken.deleteMany({
			where: { id: payload.tokenId },
		});

	} catch (_) {
		return;
	}
}

export default logoutUser;
