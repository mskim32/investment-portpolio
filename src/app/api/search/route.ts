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
  const assetTypeFilter = searchParams.get("type"); // "stock_kr", "stock_us", "crypto"

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ success: true, quotes: [] });
  }

  const cleanQuery = query.trim();

  // If the filter is specifically "stock_kr" (Korean Stock), we use Naver Finance mobile autocomplete API
  if (assetTypeFilter === "stock_kr") {
    const naverHeaders = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      Referer: "https://m.stock.naver.com/",
      Accept: "application/json",
    };

    try {
      const res = await fetch(
        `https://m.stock.naver.com/front-api/search/autoComplete?query=${encodeURIComponent(
          cleanQuery
        )}&target=stock`,
        { headers: naverHeaders, next: { revalidate: 3600 } } // Cache search results for 1 hour
      );

      if (!res.ok) {
        throw new Error(`Naver Search API responded with status ${res.status}`);
      }

      const data = await res.json();
      const items = data?.result?.items || [];

      const results = items
        .filter((item: any) => item.nationCode === "KOR" && item.code)
        .map((item: any) => {
          const suffix = item.typeCode === "KOSDAQ" ? ".KQ" : ".KS";
          return {
            symbol: `${item.code}${suffix}`,
            name: item.name,
            assetType: "stock_kr" as const,
            exchange: item.typeName || (item.typeCode === "KOSDAQ" ? "KOSDAQ" : "KOSPI"),
          };
        });

      return NextResponse.json({ success: true, quotes: results });
    } catch (error) {
      console.error("Naver ticker search failed:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch Naver quotes" }, { status: 500 });
    }
  }

  // Otherwise, we use Yahoo Finance search (for US stocks, Cryptos, or general queries)
  let yahooQuery = cleanQuery;
  const lowerQuery = yahooQuery.toLowerCase();
  
  // Apply translation if query matches any Korean key (primarily for global assets on Yahoo)
  for (const [kr, en] of Object.entries(KOREAN_TO_ENGLISH_MAP)) {
    if (lowerQuery.includes(kr)) {
      yahooQuery = yahooQuery.replace(new RegExp(kr, "gi"), en);
    }
  }

  const yahooHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
  };

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        yahooQuery
      )}&quotesCount=10&newsCount=0`,
      { headers: yahooHeaders, next: { revalidate: 3600 } } // Cache search results for 1 hour
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

        // Clean cryptocurrency symbol formatting
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
      })
      // Apply type filters requested by client
      .filter((quote: any) => {
        if (assetTypeFilter === "stock_us") {
          // Keep only US stocks/ETFs (not crypto, and not ending with .KS or .KQ)
          return quote.assetType === "stock_us" && !quote.symbol.endsWith(".KS") && !quote.symbol.endsWith(".KQ");
        }
        if (assetTypeFilter === "crypto") {
          return quote.assetType === "crypto";
        }
        return true;
      });

    return NextResponse.json({ success: true, quotes: results });
  } catch (error) {
    console.error("Yahoo ticker search failed:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch Yahoo quotes" }, { status: 500 });
  }
}
