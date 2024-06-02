"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export const useLoginForm = () => {
	const loginSchema = z.object({
		username: z
			.string()
			.min(4, { message: "Username must be at least 4 characters long" })
			.max(32, { message: "Username must be no longer than 32 characters" }),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" })
			.max(32, { message: "Password must be no longer than 32 characters" }),
	});

	const loginForm = useForm<z.infer<typeof loginSchema>>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	return [loginForm, loginSchema] as const;
};

export const useRegisterForm = () => {
	const registerSchema = z
		.object({
			email: z.string().email(),
			username: z
				.string()
				.min(4, { message: "Username must be at least 4 characters long" })
				.max(32, { message: "Username must be no longer than 32 characters" })
				.regex(/^[a-zA-Z0-9_]*$/, "Username must not contain special characters"),
			password: z
				.string()
				.min(8, { message: "Password must be at least 8 characters long" })
				.max(32, { message: "Password must be no longer than 32 characters" })
				.regex(/^[a-zA-Z0-9-@_]*$/, "Password must not contain special characters"),
			retypePassword: z
				.string()
				.min(8, { message: "Password must be at least 8 characters long" })
				.max(32, { message: "Password must be no longer than 32 characters" }),
		})
		.refine((values) => values.password == values.retypePassword, {
			message: "Passwords does not match",
			path: ["retypePassword"],
		});

	const registerForm = useForm<z.infer<typeof registerSchema>>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			email: "",
			username: "",
			password: "",
			retypePassword: "",
		},
	});

	return [registerForm, registerSchema] as const;
};

export const useCreatePostForm = () => {
	const maxFileSize = 52428800; // 50 MB
	const acceptedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

	const postSchema = z.object({
		title: z
			.string()
			.min(2, { message: "Title must be at least 2 characters long" })
			.max(255, { message: "Title must be no longer than 255 characters" }),
		description: z.string().optional(),
		attachments: z
			.any()
			.refine((file) => {
				console.log("Валидирую файл:");
				console.log(file);
				return file.size <= maxFileSize;
			}, "Max attachment size is 50 MB")
			.refine(
				(file) => acceptedFileTypes.includes(file.type),
				"Only .jpg, .png, .webp formats are supported"
			),
	});

	const postForm = useForm<z.infer<typeof postSchema>>({
		resolver: zodResolver(postSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	return [postForm, postSchema] as const;
};
