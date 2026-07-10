import { NextResponse } from "next/server";

// Translation dictionary to map Korean queries for major US/global assets to English
const KOREAN_TO_ENGLISH_MAP: { [key: string]: string } = {
  "테슬라": "Tesla",
  "애플": "Apple",
  "엔비디아": "Nvidia",
  "마이크로소프트": "Microsoft",
  "마소": "Microsoft",
  "구글": "Google",
  "알파벳": "Alphabet",
  "아마존": "Amazon",
  "메타": "Meta",
  "페이스북": "Facebook",
  "넷플릭스": "Netflix",
  "비트코인": "Bitcoin",
  "이더리움": "Ethereum",
  "도지코인": "Dogecoin",
  "솔라나": "Solana",
  "리플": "XRP",
  "에이다": "Cardano",
  "삼성전자": "Samsung Electronics",
  "삼성": "Samsung",
  "하이닉스": "Hynix",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ success: true, quotes: [] });
  }

  let cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  
  // Apply translation if query matches any Korean key
  for (const [kr, en] of Object.entries(KOREAN_TO_ENGLISH_MAP)) {
    if (lowerQuery.includes(kr)) {
      cleanQuery = cleanQuery.replace(new RegExp(kr, "gi"), en);
    }
  }

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        cleanQuery
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
