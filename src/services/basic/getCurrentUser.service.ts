import prisma from "src/utils/prismaClient.js";
import { AppError } from "@core/index.js";

const getCurrentUser = async ({ userId }) => {
	const user = await prisma.authUser.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			passwordHash: true,
			githubId: true,
			isEmailVerified: true,
			twoFactorEnabled: true,
			createdAt: true,
			updatedAt: true
		}
	});

	if (!user) throw new AppError('USER_NOT_FOUND');

	const { id, passwordHash, githubId, ...rest } = user;
	return {
		userId: id,
		...rest,
		hasPassword: !!passwordHash,
		githubLinked: !!githubId,
	};
}

export default getCurrentUser;
