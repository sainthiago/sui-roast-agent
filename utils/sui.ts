export interface WalletData {
  balance: string
  nfts: Array<{
    name: string
    collection: string
  }>
  transactions: Array<{
    type: string
    timestamp: string
    amount?: string
    token?: string
  }>
  oldestTx?: string
}

const SUI_RPC_URL = "https://fullnode.mainnet.sui.io:443"

async function suiRpcCall(method: string, params: any[]) {
  const response = await fetch(SUI_RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }
  return data.result
}

export async function getWalletData(address: string): Promise<WalletData> {
  try {
    // Get balance
    const balanceData = await suiRpcCall("suix_getBalance", [address, "0x2::sui::SUI"])
    const balance = balanceData?.totalBalance || "0"

    // Get owned objects
    const objectsData = await suiRpcCall("suix_getOwnedObjects", [
      address,
      {
        filter: {
          MatchAll: [
            {
              StructType: "0x2::devnet_nft::DevNetNFT",
            },
          ],
        },
        options: {
          showType: true,
          showContent: true,
          showDisplay: true,
        },
      },
    ])

    // Get transactions
    const txData = await suiRpcCall("suix_queryTransactionBlocks", [
      {
        filter: {
          FromAddress: address,
        },
      },
      {
        limit: 50,
        descendingOrder: true,
      },
    ])

    // Format NFTs
    const nfts = (objectsData?.data || []).map((obj: any) => ({
      name: obj?.display?.data?.name || "Unnamed NFT",
      collection: obj?.display?.data?.creator || "Unknown Collection",
    }))

    // Format transactions
    const transactions = (txData?.data || []).map((tx: any) => ({
      type: tx?.transaction?.data?.transaction?.kind || "Unknown",
      timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
      amount: tx?.transaction?.data?.transaction?.amount,
      token: tx?.transaction?.data?.transaction?.token,
    }))

    const oldestTx = transactions.length > 0 ? transactions[transactions.length - 1].timestamp : undefined

    return {
      balance,
      nfts,
      transactions,
      oldestTx,
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error)
    throw new Error("Failed to fetch wallet data")
  }
}

