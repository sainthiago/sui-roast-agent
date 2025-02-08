import { NextResponse } from "next/server";
import { getWalletData, WalletData } from "../../../../utils/sui";

function formatBalance(balance: string): string {
  try {
    const balanceNum = Number.parseInt(balance) / 1000000000; // Convert from MIST to SUI
    return balanceNum.toFixed(2);
  } catch (error) {
    console.error("Error formatting balance:", error);
    return "0.00";
  }
}

function formatWalletDataForAI(data: WalletData): string {
  try {
    const balanceSUI = formatBalance(data.balance);
    const accountAge = data.oldestTx
      ? `${Math.floor(
          (Date.now() - new Date(data.oldestTx).getTime()) /
            (1000 * 60 * 60 * 24)
        )} days`
      : "Unknown";

    // Get transaction patterns
    const transactionTypes = data.transactions.reduce(
      (acc: Record<string, number>, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
      },
      {}
    );

    return `
Wallet Analysis:
- Current Balance: ${balanceSUI} SUI
- Number of NFTs: ${data.nfts.length}
- Notable NFT Collections: ${
      data.nfts
        .slice(0, 5)
        .map((nft) => nft.collection)
        .join(", ") || "None"
    }
- Transaction Count: ${data.transactions.length}
- Account Age: ${accountAge}
- Transaction Patterns: ${Object.entries(transactionTypes)
      .map(([type, count]) => `${type}: ${count} times`)
      .join(", ")}
- Recent Activity: ${data.transactions
      .slice(0, 5)
      .map((tx) => tx.type)
      .join(", ")}
`;
  } catch (error) {
    console.error("Error formatting wallet data:", error);
    throw error;
  }
}

function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!body || !body.address) {
      return NextResponse.json(
        { error: "No wallet address provided" },
        { status: 400 }
      );
    }

    const { address } = body;

    if (!isValidSuiAddress(address)) {
      return NextResponse.json(
        {
          error:
            "Hey there! That doesn't look like a valid SUI address... Did you copy-paste it correctly, or are you trying to bamboozle me? 🤔",
        },
        { status: 400 }
      );
    }

    // Fetch wallet data with timeout
    console.log("Fetching wallet data for address:", address);
    const walletDataPromise = getWalletData(address);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Wallet data fetch timeout")), 15000)
    );

    const walletData = (await Promise.race([
      walletDataPromise,
      timeoutPromise,
    ])) as WalletData;
    console.log("Wallet data fetched successfully");

    const walletAnalysis = formatWalletDataForAI(walletData);
    console.log("Wallet analysis formatted for AI");

    // Generate roast using OpenRouter with timeout
    console.log("Sending request to OpenRouter");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "SUI Roast Agent",
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
              {
                role: "system",
                content: `You are a hilarious blockchain roast master. Your job is to create funny, witty, and slightly savage roasts 
              based on someone's SUI blockchain wallet activity. Be creative and funny, but not mean-spirited.`,
              },
              {
                role: "user",
                content: `Create a roast based on this wallet data:
              ${walletAnalysis}
              
              Generate a roast that:
              1. Starts with a funny greeting or observation about their wallet
              2. Makes specific jokes about:
                 - Their SUI balance (are they a whale or a minnow?)
                 - Their NFT collections (or lack thereof)
                 - Their transaction patterns (frequent trader or hodler?)
                 - Their account age (newbie or veteran?)
              3. Ends with a playful encouragement or prediction about their future in crypto
              
              Use emojis and keep it entertaining! If they have very little activity, make jokes about them being too careful or scared of the blockchain.`,
              },
            ],
            temperature: 0.9,
            max_tokens: 500,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenRouter API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data || !data.choices || !data.choices[0]?.message?.content) {
        console.error("Invalid OpenRouter response format:", data);
        throw new Error("Invalid response format from OpenRouter");
      }

      const roast = data.choices[0].message.content;
      console.log("Roast generated successfully");

      return NextResponse.json({ roast });
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("OpenRouter API request timed out");
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error in roast API:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Determine the appropriate error message based on the error type
    let errorMessage =
      "Oops! Something went wrong while roasting your wallet! 🌶️";
    let statusCode = 500;

    if (error.message.includes("OPENROUTER_API_KEY")) {
      errorMessage =
        "The roast master is taking a coffee break (API configuration issue). Please try again later! ☕";
    } else if (error.message.includes("timed out")) {
      errorMessage =
        "Whew! Your wallet is so complex it made our roaster overheat! Try again? 🔥";
    } else if (error.message.includes("SUI")) {
      errorMessage =
        "Had some trouble reading your SUI wallet. Are you sure it exists? 🤔";
      statusCode = 400;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
