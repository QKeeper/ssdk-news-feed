import { Counter } from "@/features/counter/Counter";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
	const navigate = useNavigate();

	// Пока что не вижу смысла в этой странице
	useEffect(() => {
		navigate("/feed");
	});

	return (
		<>
			<Counter />
		</>
	);
};

export default Homepage;
