const BASE_URL = "http://localhost:3000/api/trades";

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
    }
    return response.json();
};

// GET ALL
export const getTrades = async () => {
    const response = await fetch(BASE_URL);
    return handleResponse(response);
};

// CREATE
export const createTrade = async (tradeData) => {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData)
    });
    return handleResponse(response);
};

// DELETE
export const deleteTradeApi = async (id) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE"
    });
    return handleResponse(response);
};