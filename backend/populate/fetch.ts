import { ApiResponse, FetchOptions } from "./types";

const apiKeys = [
  "pu9DShPFCotgX8VGGhuB3Cv8VQAjJp0Zp0YfdsJI",
  "CsjmOmUE6s9vpqJ79boALrdKzMSs0vbZfM6tm3kn",
  "R3ocagtQTKGgN3HeJygQoSTPKcG7363TUYlfFejI",
  "eNLbh360E9PyR4pAeMV6ERseR9K1nXPgbs1kGVi9",
  "8zAOfLqeChggb3QqJuyEEl9ggt4xv0SCYBiuJkqg",
  "qBZSCZcRPcUKaWjsTfeiQrYfbkoemGJtgm4nBIYt"
]

const fetchData = async <ResultType>(
  url: URL,
): Promise<ResultType[]> => {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("Sem API KEY");
  }

  const options: FetchOptions = {
    timeout: 10000,
    retryDelay: 5000,
    maxRetries: 3,
    requestDelay: 240,
    maxRequestPerKey: 250
  }

  const allResults: ResultType[] = [];
  let skip = 0;
  let total = 0;
  let apiKeyIndex = 0;
  let requestCount = 0;

  const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

  const getCurrentApiKey = (): string => apiKeys[apiKeyIndex];

  const rotateApiKey = (): string => {
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
    requestCount = 0;
    return getCurrentApiKey();
  };

  const buildUrl = (url: URL, skipValue: number, apiKey: string): URL => {
    url.searchParams.set("skip", skipValue.toString());
    url.searchParams.append("api_key", apiKey);
    return url;
  };

  const makeRequest = async (requestUrl: URL): Promise<ApiResponse<ResultType>> => {
    let retries = 0;

    while (retries < options.maxRetries) {
      try {
        if (requestCount >= options.maxRequestPerKey) {
          console.log(`Reached request limit (${options.maxRequestPerKey}) for key. Rotating API key.`);
          rotateApiKey();
        }

        requestCount++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(requestUrl.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json() as ApiResponse<ResultType>;
        } else if (response.status === 404) {
          console.log("Nada encontrado. Retornando array vazio.");
          return { results: [] };
        } else if (response.status === 429) {
          console.warn(`Rate limit exceeded for key ${getCurrentApiKey()}. Rotating API key...`);
          rotateApiKey();
          requestUrl.searchParams.set("api_key", getCurrentApiKey());
          await sleep(options.retryDelay);
        } else {
          throw new Error(`HTTP Error: ${response.status}`);
        }
      } catch (error: any) {
        retries++;

        if (error.name === 'AbortError') {
          console.warn(`Request timeout. Attempt ${retries}/${options.maxRetries}`);
        } else {
          console.error(`Request failed: ${error.message}. Attempt ${retries}/${options.maxRetries}`);
        }

        if (retries >= options.maxRetries) {
          throw new Error(`Failed after ${options.maxRetries} attempts: ${error.message}`);
        }

        await sleep(options.retryDelay * Math.pow(2, retries - 1));
      }
    }

    throw new Error("Request failed after maximum retries");
  };

  try {
    do {
      const requestUrl = buildUrl(url, skip, getCurrentApiKey());

      console.log(`Fetching data with skip=${skip}, using API key index ${apiKeyIndex}`);
      const data = await makeRequest(requestUrl);

      if (data.results && data.results.length > 0) {
        allResults.push(...data.results);
      }

      total = data.meta?.results?.total || 0;
      console.log(`Total results: ${total}`);
      const limit = data.meta?.results?.limit || 0;
      skip += limit;

      if (skip < total) {
        await sleep(options.requestDelay);
      }
    } while (skip < total && total > 0);

    return allResults;
  } catch (error) {
    console.error("Data fetching failed:", error);
    throw error;
  }
};

export { fetchData }
