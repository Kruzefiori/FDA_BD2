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
  searchAfter: boolean = false
): Promise<ResultType[]> => {
  if (!apiKeys || apiKeys.length === 0) {
    throw new Error("Sem API KEY");
  }

  const options: FetchOptions = {
    timeout: 10000,
    retryDelay: 5000,
    maxRetries: 3,
    requestDelay: 240,
    maxRequestPerKey: 250,
  };

  const allResults: ResultType[] = [];
  let skip = 0;
  let total = 0;
  let apiKeyIndex = 0;
  let requestCount = 0;

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getCurrentApiKey = (): string => apiKeys[apiKeyIndex];

  const rotateApiKey = (): string => {
    apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
    requestCount = 0;
    return getCurrentApiKey();
  };

  const buildUrl = (baseUrl: URL, skipValue: number, apiKey: string, searchAfter: boolean): URL => {
    const newUrl = new URL(baseUrl.toString()); // clone to avoid mutation
    if (!searchAfter) {
      newUrl.searchParams.set("skip", skipValue.toString());
    }
    newUrl.searchParams.set("api_key", apiKey);
    return newUrl;
  };

  const makeRequest = async (requestUrl: URL): Promise<{
    response: ApiResponse<ResultType>;
    headers?: Headers;
  }> => {
    let retries = 0;

    while (retries < options.maxRetries) {
      try {
        if (requestCount >= options.maxRequestPerKey) {
          console.log(`Reached request limit for current key. Rotating API key.`);
          rotateApiKey();
        }

        requestCount++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(requestUrl.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          return {
            response: (await response.json()) as ApiResponse<ResultType>,
            headers: response.headers,
          };
        } else if (response.status === 404) {
          console.warn("No data found. Returning empty array.");
          return {
            response: { results: [] } as ApiResponse<ResultType>,
            headers: response.headers,
          };
        } else if (response.status === 429) {
          console.warn(`Rate limit hit. Rotating API key.`);
          rotateApiKey();
          requestUrl.searchParams.set("api_key", getCurrentApiKey());
          await sleep(options.retryDelay);
        } else {
          throw new Error(`HTTP Error: ${response.status}`);
        }
      } catch (error: any) {
        retries++;
        console.error(`Request error (${error.message}). Retry ${retries}/${options.maxRetries}`);

        if (retries >= options.maxRetries) {
          throw new Error(`Failed ${requestUrl} after ${options.maxRetries} attempts: ${error.message}`);
        }

        await sleep(options.retryDelay * Math.pow(2, retries - 1));
      }
    }

    throw new Error("Exceeded max retries");
  };

  try {
    if (!searchAfter) {
      do {
        const requestUrl = buildUrl(url, skip, getCurrentApiKey(), false);

        console.log(`Fetching with skip=${skip}, API key index ${apiKeyIndex}`);
        const requestData = await makeRequest(requestUrl);

        const data = requestData.response;
        if (data.results?.length) {
          allResults.push(...data.results);
        }

        total = data.meta?.results?.total || 0;
        const limit = data.meta?.results?.limit || data.results.length;
        skip += limit;

        if (skip < total) {
          await sleep(options.requestDelay);
        }
      } while (skip < total && total > 0);
    } else {
      let nextUrl: string | null = url.toString();

      while (nextUrl) {
        const requestUrl = buildUrl(new URL(nextUrl), 0, getCurrentApiKey(), true);

        console.log(`Fetching paginated URL: ${requestUrl}`);
        const requestData = await makeRequest(requestUrl);

        if (requestData.response?.results?.length) {
          allResults.push(...requestData.response.results);
        }

        const linkHeader = requestData.headers?.get("Link");
        const match = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = match ? match[1] : null;

        if (nextUrl) {
          console.log(`Next URL: ${nextUrl}`);
          await sleep(options.requestDelay);
        } else {
          console.log("No more pages to fetch.");
        }
      }
    }

    return allResults;
  } catch (error) {
    console.error("Data fetching failed:", error);
    throw error;
  }
};

export { fetchData }
