"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getWalletData, type WalletData } from "./sui"

function formatBalance(balance: string): string {
  const balanceNum = Number.parseInt(balance) / 1000000000 // Convert from MIST to SUI
  return balanceNum.toFixed(2)
}

function formatWalletDataForAI(data: WalletData): string {
  const balanceSUI = formatBalance(data.balance)
  const accountAge = data.oldestTx
    ? `${Math.floor((Date.now() - new Date(data.oldestTx).getTime()) / (1000 * 60 * 60 * 24))} days`
    : "Unknown"

  // Get transaction patterns
  const transactionTypes = data.transactions.reduce((acc: Record<string, number>, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1
    return acc
  }, {})

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
`
}

export async function generateRoast(address: string): Promise<string> {
  try {
    // Validate address format
    if (!address.startsWith("0x") || address.length !== 42) {
      throw new Error("Invalid SUI address format")
    }

    // Fetch wallet data
    const walletData = await getWalletData(address)
    const walletAnalysis = formatWalletDataForAI(walletData)

    // Generate roast using AI
    const prompt = `
You are a hilarious blockchain roast master. Your job is to create a funny, witty, and slightly savage roast 
based on someone's SUI blockchain wallet activity. Make specific references to their trading behavior, 
NFT collections, and general blockchain activity. Be creative and funny, but not mean-spirited.

Here's the wallet data to roast:
${walletAnalysis}

Generate a roast that:
1. Starts with a funny greeting or observation about their wallet
2. Makes specific jokes about:
   - Their SUI balance (are they a whale or a minnow?)
   - Their NFT collections (or lack thereof)
   - Their transaction patterns (frequent trader or hodler?)
   - Their account age (newbie or veteran?)
3. Ends with a playful encouragement or prediction about their future in crypto

Use emojis and keep it entertaining! If they have very little activity, make jokes about them being too careful or scared of the blockchain.
`

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt,
      temperature: 0.9,
      maxTokens: 500,
    })

    return text
  } catch (error: any) {
    console.error("Error generating roast:", error)
    if (error.message === "Invalid SUI address format") {
      return "Hey there! That doesn't look like a valid SUI address... Did you copy-paste it correctly, or are you trying to bamboozle me? 🤔\n\nMake sure it starts with '0x' and is 42 characters long! Let's try again with a real address! 🎯"
    }
    return "Oops! Either this wallet is too hot to handle, or something went wrong! 🌶️\n\nMake sure you've entered a valid SUI wallet address, and let's try roasting again! 🔥"
  }
}

