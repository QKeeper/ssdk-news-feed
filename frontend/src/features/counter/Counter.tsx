import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
	decrement,
	increment,
	incrementAsync,
	incrementByAmount,
	selectCount,
	selectStatus,
} from "./counterSlice";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Тут я просто тренировался использовать Redux
export const Counter = () => {
	const dispatch = useAppDispatch();
	const count = useAppSelector(selectCount);
	const status = useAppSelector(selectStatus);
	const [incrementAmount, setIncrementAmount] = useState("2");
	const incrementValue = Number(incrementAmount) || 0;

	return (
		<div className="flex flex-col gap-2 w-64 m-2 p-2 border rounded bg-neutral-900">
			<h2 className="text-sm font-medium text-center">Redux Counter Test</h2>
			<div className="flex gap-2 items-center">
				<Button
					size="icon"
					variant="outline"
					className="aspect-square"
					onClick={() => dispatch(decrement())}
				>
					<ChevronLeft />
				</Button>
				<span
					className={cn(
						"font-medium w-full py-1 text-center border rounded bg-neutral-950 duration-500",
						status == "loading" && "bg-neutral-900",
						status == "failed" && "bg-red-950"
					)}
				>
					{count}
				</span>
				<Button
					size="icon"
					variant="outline"
					className="aspect-square"
					onClick={() => dispatch(increment())}
				>
					<ChevronRight />
				</Button>
			</div>
			<div className="flex flex-col gap-2">
				<Input
					type="number"
					value={incrementAmount}
					className="bg-neutral-950"
					onChange={(e) => setIncrementAmount(e.target.value)}
				/>
				<div className="grid grid-cols-2 gap-2">
					<Button variant="outline" onClick={() => dispatch(incrementByAmount(incrementValue))}>
						Add Amount
					</Button>
					<Button variant="outline" onClick={() => dispatch(incrementAsync(incrementValue))}>
						Add Async
					</Button>
				</div>
			</div>
		</div>
	);
};
