import { getWalletData, type WalletData } from "./sui";

function formatBalance(balance: string): string {
  const balanceNum = Number.parseInt(balance) / 1000000000; // Convert from MIST to SUI
  return balanceNum.toFixed(2);
}

function formatWalletDataForAI(data: WalletData): string {
  const balanceSUI = formatBalance(data.balance);
  const accountAge = data.oldestTx
    ? `${Math.floor(
        (Date.now() - new Date(data.oldestTx).getTime()) / (1000 * 60 * 60 * 24)
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
}

function isValidSuiAddress(address: string): boolean {
  // SUI addresses start with 0x and are hex strings
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

export async function generateRoast(address: string): Promise<string> {
  try {
    // Updated validation for SUI addresses
    if (!isValidSuiAddress(address)) {
      throw new Error("Invalid SUI address format");
    }

    // Fetch wallet data
    const walletData = await getWalletData(address);
    const walletAnalysis = formatWalletDataForAI(walletData);

    // Generate roast using OpenRouter
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            typeof window !== "undefined"
              ? window.location.origin
              : "http://localhost:3000",
          "X-Title": "SUI Roast Agent",
        },
        body: JSON.stringify({
          model: "anthropic/claude-2",
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
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenRouter API Error:", error);
      throw new Error(error.message || "Failed to generate roast");
    }

    const data = await response.json();
    const roast = data.choices[0]?.message?.content;

    if (!roast) {
      throw new Error("No roast generated");
    }

    return roast;
  } catch (error: any) {
    console.error("Error generating roast:", error);

    if (error.message === "Invalid SUI address format") {
      return "Hey there! That doesn't look like a valid SUI address... Did you copy-paste it correctly, or are you trying to bamboozle me? 🤔\n\nMake sure it's a valid SUI address starting with '0x' followed by 64 hexadecimal characters! Let's try again! 🎯";
    }

    if (error.message?.includes("API key")) {
      return "Oops! Looks like my roasting powers are temporarily offline (API key issues). Please try again later! 🔧";
    }

    return "Oops! Either this wallet is too hot to handle, or something went wrong! 🌶️\n\nMake sure you've entered a valid SUI wallet address, and let's try roasting again! 🔥";
  }
}
