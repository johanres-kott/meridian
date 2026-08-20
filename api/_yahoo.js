// Delad Yahoo Finance-crumb (cookie + crumb för query2-API:erna) med 5 min
// cache per serverless-instans. Tidigare tre kopior i company/quarterly/
// ownership — bara ownership cachade, och company är husets hetaste endpoint.

export const UA = "Mozilla/5.0";

let crumbCache = { data: null, expires: 0 };

export async function getYahooCrumb() {
  if (crumbCache.data && Date.now() < crumbCache.expires) return crumbCache.data;
  try {
    const cookieRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    const cookies = cookieRes.headers.get("set-cookie") ?? "";
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, "Cookie": cookies },
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.length < 3) return null;
    const result = { crumb, cookies };
    crumbCache = { data: result, expires: Date.now() + 5 * 60 * 1000 };
    return result;
  } catch {
    return null;
  }
}
