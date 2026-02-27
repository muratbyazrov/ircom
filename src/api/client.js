const API_URL = (import.meta.env.VITE_IRCOM_API_URL || "http://127.0.0.1:3002/ircom-api/v1").trim();

const parseErrorMessage = (payload) => {
  if (!payload) return "Request failed";
  if (typeof payload === "string") return payload;
  if (payload?.error?.message) return payload.error.message;
  if (payload?.message) return payload.message;
  return "Request failed";
};

export async function callApi({ domain, event, params }) {
  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ domain, event, params: params || {} }),
    });
  } catch {
    throw new Error(`Network error: cannot reach API at ${API_URL}`);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(parseErrorMessage(payload) || `HTTP ${response.status}`);
  }

  if (payload?.error) {
    throw new Error(parseErrorMessage(payload));
  }

  return payload?.data ?? payload;
}

export function createDomainApi(domain) {
  return (event, params) => callApi({ domain, event, params });
}
