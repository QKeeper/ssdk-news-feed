import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useRegisterForm } from "@/hooks/use-form";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useDispatch } from "react-redux";
import { logIn } from "@/features/user/userSlice";

const Register = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [registerForm, registerSchema] = useRegisterForm();
	const [active, setActive] = useState(true);
	const dispatch = useDispatch();

	useEffect(() => {
		if (location.state) {
			registerForm.setValue("username", location.state.username);
			registerForm.setValue("email", location.state.email);
			registerForm.setValue("password", location.state.password);
		}
		registerForm.setFocus("username");
	}, []);

	function onSubmit(values: z.infer<typeof registerSchema>) {
		setActive(false);
		axios
			.post(import.meta.env.VITE_API + "/register", values, { withCredentials: true })
			.then((res) => {
				dispatch(logIn(res.data));
				navigate("/");
			})
			.catch((err) => {
				setActive(true);
				if (err.response) {
					if (("" + err.response.data).toLowerCase().includes("username"))
						registerForm.setError("username", { type: "manual", message: err.response.data });
					if (("" + err.response.data).toLowerCase().includes("email"))
						registerForm.setError("email", { type: "manual", message: err.response.data });
				}
			});
	}

	return (
		<div className="sm:w-96 w-full px-4 mx-auto mt-8">
			<Form {...registerForm}>
				<form onSubmit={registerForm.handleSubmit(onSubmit)} className="flex flex-col gap-y-8">
					<h1 className="text-center text-2xl font-bold">Registration</h1>
					<FormField
						control={registerForm.control}
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Username</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={registerForm.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={registerForm.control}
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
					<FormField
						control={registerForm.control}
						name="retypePassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Retype password</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" disabled={!active}>
						Sign Up
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => navigate("/login", { state: registerForm.getValues() })}
						type="button"
					>
						Already have an accound?
					</Button>
				</form>
			</Form>
		</div>
	);
};

export default Register;
