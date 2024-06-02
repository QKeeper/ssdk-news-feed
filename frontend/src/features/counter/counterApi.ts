// A mock function to mimic making an async request for data
export const fetchCount = (_amount = 1) => {
	return new Promise<{ data: number }>((resolve) => setTimeout(() => resolve, 500));
};
