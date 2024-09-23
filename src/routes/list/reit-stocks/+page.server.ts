export const load = async ({ locals }) => {
  const getAllREITs = async () => {
    const { apiKey, apiURL } = locals;

    const postData = { filterList: "reit" };
    const response = await fetch(apiURL + "/filter-stock-list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(postData),
    });

    const output = await response.json();

    return output;
  };

  // Make sure to return a promise
  return {
    getAllREITs: await getAllREITs(),
  };
};