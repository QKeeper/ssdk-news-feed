import axios from "axios";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCookie } from "react-use";
import { useAppDispatch } from "./redux";
import { logIn, logOut } from "@/features/user/userSlice";

export const useAuth = () => {
	/*
	 * Разлогинивает со страницы если
	 * токен не проходит проверку
	 *
	 * Более не используется
	 */
	const [, , deleteToken] = useCookie("access_token");
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		(async () => {
			axios
				.post(import.meta.env.VITE_API + "/auth", { withCredentials: true })
				.then((res) => dispatch(logIn(res.data)))
				.catch((err) => {
					if (err.response.status === 401) {
						console.warn("This page is require auth");
						dispatch(logOut());
						deleteToken();
						navigate("/login", { state: { last: location.pathname } });
					}
				});
		})();
	});
};
