import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ success: true, quotes: [] });
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        query
      )}&quotesCount=8&newsCount=0`,
      { headers, next: { revalidate: 3600 } } // Cache search results for 1 hour
    );

    if (!res.ok) {
      throw new Error(`Yahoo Search API responded with status ${res.status}`);
    }

    const data = await res.json();
    const quotes = data?.quotes || [];

    const results = quotes
      .filter((q: any) => q.symbol && (q.shortname || q.longname))
      .map((q: any) => {
        const symbol = q.symbol.toUpperCase();
        const name = q.longname || q.shortname;
        
        // Map Yahoo's quoteType / symbol to our AssetType
        let assetType: "stock_kr" | "stock_us" | "crypto" = "stock_us";
        
        const quoteType = q.quoteType?.toUpperCase() || "";
        const disp = q.typeDisp?.toUpperCase() || "";
        
        if (quoteType === "CRYPTOCURRENCY" || disp.includes("CRYPTO") || symbol.includes("-USD")) {
          assetType = "crypto";
        } else if (symbol.endsWith(".KS") || symbol.endsWith(".KQ")) {
          assetType = "stock_kr";
        } else {
          assetType = "stock_us";
        }

        // Clean cryptocurrency symbol formatting (e.g. BTC-USD -> BTC) for user interface consistency
        let cleanSymbol = symbol;
        if (assetType === "crypto" && symbol.endsWith("-USD")) {
          cleanSymbol = symbol.replace("-USD", "");
        } else if (assetType === "crypto" && symbol.endsWith("-KRW")) {
          cleanSymbol = symbol.replace("-KRW", "");
        }

        return {
          symbol: cleanSymbol,
          name,
          assetType,
          exchange: q.exchange,
        };
      });

    return NextResponse.json({ success: true, quotes: results });
  } catch (error) {
    console.error("Ticker search failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quotes" }, { status: 500 });
  }
}
