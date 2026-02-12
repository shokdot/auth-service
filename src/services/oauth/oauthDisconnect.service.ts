import prisma from "src/utils/prismaClient.js";
import { AppError } from "@core/index.js";

const oauthDisconnect = async (userId: string) => {
	const user = await prisma.authUser.findUnique({
		where: { id: userId }
	});

	if (!user) throw new AppError('USER_NOT_FOUND');

	if (!user.githubId) throw new AppError('GITHUB_NOT_LINKED');

	if (!user.passwordHash) throw new AppError('PASSWORD_REQUIRED_FOR_DISCONNECT');

	await prisma.authUser.update({
		where: { id: userId },
		data: { githubId: null },
	});
}

export default oauthDisconnect;
