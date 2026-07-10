import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase());
  const results: { [symbol: string]: { price: number; change24h: number; currency: string } } = {};

  // Standard browser-like user agent to avoid Yahoo Finance 403 blocks
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  const fetchPromises = symbols.map(async (symbol) => {
    try {
      // Normalize crypto tickers from yahoo format if needed
      // e.g. BTC -> BTC-USD (if crypto)
      let yahooSymbol = symbol;
      if (symbol === "BTC") yahooSymbol = "BTC-USD";
      else if (symbol === "ETH") yahooSymbol = "ETH-USD";
      else if (symbol === "SOL") yahooSymbol = "SOL-USD";
      else if (symbol === "XRP") yahooSymbol = "XRP-USD";

      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`,
        { headers, next: { revalidate: 60 } } // Cache for 60 seconds
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;

      if (!meta) {
        throw new Error("Invalid response format");
      }

      const price = meta.regularMarketPrice;
      const prevClose = meta.previousClose || price;
      const change24h = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;
      const currency = meta.currency || (symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "KRW" : "USD");

      results[symbol] = {
        price,
        change24h,
        currency,
      };
    } catch (error) {
      console.error(`Error fetching symbol ${symbol}:`, error);
      // Fallback or skip
      results[symbol] = {
        price: 0,
        change24h: 0,
        currency: symbol.endsWith(".KS") || symbol.endsWith(".KQ") ? "KRW" : "USD",
      };
    }
  });

  // Always fetch USD/KRW exchange rate for currency conversions
  const exchangeRatePromise = (async () => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d`,
        { headers, next: { revalidate: 300 } } // Cache exchange rate for 5 mins
      );
      if (res.ok) {
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta?.regularMarketPrice) {
          results["KRW=X"] = {
            price: meta.regularMarketPrice,
            change24h: 0,
            currency: "KRW",
          };
        }
      }
    } catch (error) {
      console.error("Error fetching USD/KRW exchange rate:", error);
      // Fallback exchange rate
      results["KRW=X"] = {
        price: 1350, // default fallback
        change24h: 0,
        currency: "KRW",
      };
    }
  })();

  await Promise.all([...fetchPromises, exchangeRatePromise]);

  return NextResponse.json({ success: true, data: results });
}
