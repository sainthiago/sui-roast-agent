import { SuiClient } from "@mysten/sui.js/client";

export interface WalletData {
  balance: string;
  nfts: Array<{
    name: string;
    collection: string;
  }>;
  transactions: Array<{
    type: string;
    timestamp: string;
    amount?: string;
    token?: string;
  }>;
  oldestTx?: string;
}

const suiClient = new SuiClient({
  url: "https://fullnode.mainnet.sui.io",
});

export async function getWalletData(
  address: string
): Promise<WalletData | null> {
  try {
    const [balance, objectsData, txData] = await Promise.all([
      suiClient.getBalance({
        owner: address,
        coinType: "0x2::sui::SUI",
      }),
      suiClient.getOwnedObjects({
        owner: address,
        options: { showContent: true, showDisplay: true },
      }),
      suiClient.queryTransactionBlocks({
        filter: { FromAddress: address },
        limit: 50,
        order: "descending",
      }),
    ]);

    // Format NFTs - now checking for any NFT-like objects
    const nfts = (objectsData?.data || [])
      .filter((obj) => {
        const type = obj?.data?.type || "";
        return (
          type.toLowerCase().includes("nft") ||
          type.toLowerCase().includes("collection") ||
          (obj?.data?.display?.data?.name &&
            obj?.data?.display?.data?.description)
        );
      })
      .map((obj) => ({
        name: obj?.data?.display?.data?.name || "Unnamed NFT",
        collection: obj?.data?.display?.data?.creator || "Unknown Collection",
      }));

    // Format transactions
    const transactions = (txData?.data).map((tx) => ({
      type: tx?.transaction?.data?.transaction?.kind || "Unknown",
      timestamp: new Date(Number(tx.timestampMs) * 1000).toISOString(),
      /*       amount: tx?.transaction?.data?.transaction?.amount,
      token: tx?.transaction?.data?.transaction?.token, */
    }));

    const oldestTx =
      transactions.length > 0
        ? transactions[transactions.length - 1].timestamp
        : undefined;

    return {
      balance: balance.totalBalance,
      nfts,
      transactions,
      oldestTx,
    };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return null;
  }
}
