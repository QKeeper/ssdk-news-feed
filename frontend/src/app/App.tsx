import { useEffect } from "react";
import { useCookie } from "react-use";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppDispatch } from "@/hooks/redux";
import { logIn } from "@/features/user/userSlice";
import axios from "axios";
import { ThemeProvider } from "@/components/ThemeProvider";
import Homepage from "@/pages/Homepage";
import Login from "@/pages/Login";
import Header from "@/components/Header";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import Profile from "@/pages/Profile";
import Feed from "@/pages/Feed";
import FullPost from "@/pages/FullPost";

function App() {
	const [accessToken, _, deleteToken] = useCookie("access_token");
	const dispatch = useAppDispatch();

	useEffect(() => {
		if (accessToken) {
			axios
				.post(import.meta.env.VITE_API + "/auth", null, { withCredentials: true })
				.then((res) => dispatch(logIn(res.data)))
				.catch((err) => {
					deleteToken();
					console.error(err);
				});
		}
	}, []);

	return (
		<ThemeProvider defaultTheme="dark">
			<BrowserRouter>
				<Header />
				<div className="container flex flex-col min-h-[calc(100vh-3rem)]">
					<Routes>
						<Route path="/" element={<Homepage />} />
						<Route path="*" element={<NotFound />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/feed" element={<Feed />} />
						<Route path="/user/:username" element={<Profile />} />
						<Route path="/post/:id" element={<FullPost />} />
					</Routes>
				</div>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
