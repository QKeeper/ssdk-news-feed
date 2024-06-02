import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ConfettiExplosion from "react-confetti-explosion";

const NotFound = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [count, setCount] = useState(404);
	const redirect = () =>
		navigate(location.state && location.state.last ? location.state.last : "/");

	return (
		<div className="mx-auto flex flex-col items-center my-auto select-none">
			{count == 1000 && setTimeout(() => redirect(), 4000) && (
				<ConfettiExplosion
					className="bg-red-500"
					force={0.6}
					duration={4000}
					particleCount={50}
					width={600}
				/>
			)}
			<p
				className="text-9xl font-bold -mt-32 hover:bg-neutral-900 px-8 py-4 rounded-xl cursor-pointer duration-100"
				onClick={() => {
					if (count < 1000) setCount(count + 1);
				}}
			>
				{count}
			</p>
			<h1 className="text-4xl font-semibold mt-4">🤌 Page not found!</h1>
			<Button size="lg" variant="secondary" className="mt-12" onClick={() => redirect()}>
				Fuck, Go {location.state && location.state.last ? "Back" : "Home"}!
			</Button>
		</div>
	);
};

export default NotFound;
