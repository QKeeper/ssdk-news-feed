import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
// Validate
import { z } from "zod";
import { useLoginForm } from "@/hooks/use-form";
// Redux
import { useAppDispatch } from "@/hooks/redux";
import { logIn } from "@/features/user/userSlice";
// UI
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";

const Login = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [loginForm, loginSchema] = useLoginForm();
	const [active, setActive] = useState(true);
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (location.state) {
			loginForm.setValue("username", location.state.email || location.state.username);
			loginForm.setValue("password", location.state.password);
		}
		loginForm.setFocus("username");
	}, []);

	function onSubmit(values: z.infer<typeof loginSchema>) {
		setActive(false);
		axios
			.post(import.meta.env.VITE_API + "/login", values, { withCredentials: true })
			.then((res) => {
				dispatch(logIn(res.data));
				console.log(res.data);
				navigate(location.state ? location.state.last : "/");
			})
			.catch((err) => {
				setActive(true);
				if (err.response) {
					if (("" + err.response.data).toLowerCase().includes("username"))
						loginForm.setError("username", { type: "manual", message: err.response.data });
					if (("" + err.response.data).toLowerCase().includes("password"))
						loginForm.setError("password", { type: "manual", message: err.response.data });
				} else {
					console.error(err.message);
				}
			});
	}

	return (
		<div className="sm:w-96 w-full px-4 mx-auto mt-8">
			<Form {...loginForm}>
				<form onSubmit={loginForm.handleSubmit(onSubmit)} className="flex flex-col gap-y-8">
					<h1 className="text-center text-2xl font-bold">Login</h1>
					<FormField
						control={loginForm.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username or Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={loginForm.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={!active}>
						Sign In
					</Button>
					<div className="flex">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => navigate("/register", { state: loginForm.getValues() })}
							type="button"
						>
							Don't have an account yet?
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="ml-auto"
							onClick={() => navigate("/404", { state: { last: "/login" } })}
							type="button"
						>
							Forgot password?
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};

export default Login;
