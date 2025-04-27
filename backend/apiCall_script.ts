const fetchData = async (url: string, apiKey: string) => {
  console.log("Fetching data from:", url);
  const finalUrl = new URL(url);
  finalUrl.searchParams.append("api_key", apiKey);

  console.log("Final URL:", finalUrl.toString());

  const response = await fetch(finalUrl.toString());
  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return await response.json();
};
const urlEndpoint = "https://api.fda.gov/drug/event.json?limit=10"
const data = fetchData(urlEndpoint , "8zAOfLqeChggb3QqJuyEEl9ggt4xv0SCYBiuJkqg" )