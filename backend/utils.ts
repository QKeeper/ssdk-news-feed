import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";

export const jwtSign = (username: string) =>
	jwt.sign({ username: username.toLowerCase() }, process.env.SECRET!, { expiresIn: "7 days" });

export const jwtVerify = (token: string) => {
	try {
		return (jwt.verify(token, process.env.SECRET!) as JwtPayload).username as string;
	} catch (err: unknown) {}
};
