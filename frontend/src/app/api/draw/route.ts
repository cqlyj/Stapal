import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { STAPAL_ABI } from "@/contracts/abis";
import { CONTRACT_ADDRESSES, PYTH_PRICE_FEED_ID } from "@/contracts/addresses";

export async function POST(_request: NextRequest) {
  try {
    console.log("=== Starting Draw API ===");
    const privateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!privateKey) {
      console.error("Admin private key not configured");
      return NextResponse.json(
        { error: "Admin private key not configured" },
        { status: 500 }
      );
    }

    if (!privateKey.startsWith("0x")) {
      console.error("Invalid private key format");
      return NextResponse.json(
        { error: "Invalid private key format. Must start with 0x" },
        { status: 500 }
      );
    }

    console.log("Creating wallet client...");
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log("Account address:", account.address);

    const client = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http("https://sepolia-rollup.arbitrum.io/rpc"),
    }).extend(publicActions);

    console.log("Wallet client created successfully");

    const updates: {
      step: string;
      status: "pending" | "processing" | "completed" | "error";
      txHash?: string;
      message?: string;
    }[] = [];

    // Step 1: Request Random Number
    console.log("Step 1: Requesting random number...");
    updates.push({
      step: "requestRandomNumber",
      status: "processing",
      message: "Requesting random number from Entropy...",
    });

    try {
      console.log("Reading Entropy fee...");
      const entropyFee = await client.readContract({
        address: "0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440" as `0x${string}`,
        abi: [
          {
            type: "function",
            name: "getFeeV2",
            inputs: [],
            outputs: [{ type: "uint256" }],
            stateMutability: "view",
          },
        ],
        functionName: "getFeeV2",
      });
      console.log("Entropy fee:", entropyFee);

      console.log("Calling requestRandomNumber...");
      const hash1 = await client.writeContract({
        address: CONTRACT_ADDRESSES.STAPAL,
        abi: STAPAL_ABI,
        functionName: "requestRandomNumber",
        value: entropyFee as bigint,
      });
      console.log("Transaction hash:", hash1);

      console.log("Waiting for confirmation...");
      await client.waitForTransactionReceipt({ hash: hash1 });
      console.log("Transaction confirmed!");

      updates[0].status = "completed";
      updates[0].txHash = hash1;

      // Wait for entropy callback
      console.log("Waiting for entropy callback...");
      updates.push({
        step: "waiting",
        status: "processing",
        message: "Waiting for entropy callback (~10 seconds)...",
      });

      await new Promise((resolve) => setTimeout(resolve, 10000));

      updates[1].status = "completed";
      console.log("Callback wait completed");
    } catch (error) {
      console.error("Step 1 error:", error);
      updates[0].status = "error";
      updates[0].message =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json({ updates }, { status: 500 });
    }

    // Step 2: Draw Winners
    console.log("Step 2: Drawing winners...");
    updates.push({
      step: "drawWinners",
      status: "processing",
      message: "Drawing winners based on random number...",
    });

    try {
      console.log("Calling drawWinners...");
      const hash2 = await client.writeContract({
        address: CONTRACT_ADDRESSES.STAPAL,
        abi: STAPAL_ABI,
        functionName: "drawWinners",
      });
      console.log("Transaction hash:", hash2);

      console.log("Waiting for confirmation...");
      await client.waitForTransactionReceipt({ hash: hash2 });
      console.log("Transaction confirmed!");

      updates[2].status = "completed";
      updates[2].txHash = hash2;
    } catch (error) {
      console.error("Step 2 error:", error);
      updates[2].status = "error";
      updates[2].message =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json({ updates }, { status: 500 });
    }

    // Step 3: Update Price and Distribute
    console.log("Step 3: Updating price and distributing...");
    updates.push({
      step: "updatePriceAndDistribute",
      status: "processing",
      message: "Fetching price data and distributing prizes...",
    });

    try {
      // Fetch price feed update data from Hermes API
      console.log("Fetching price feed update data for:", PYTH_PRICE_FEED_ID);

      // Use the proper Hermes endpoint format
      const hermesUrl = `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${PYTH_PRICE_FEED_ID}`;
      console.log("Hermes URL:", hermesUrl);

      const response = await fetch(hermesUrl);
      if (!response.ok) {
        throw new Error(`Hermes API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawPriceData = data.binary.data;

      if (!Array.isArray(rawPriceData) || rawPriceData.length === 0) {
        throw new Error("Invalid price update data from Hermes");
      }

      // Hermes returns hex strings without 0x prefix - we need to add it
      const priceFeedUpdateData = rawPriceData.map((hexString: string) =>
        hexString.startsWith("0x") ? hexString : `0x${hexString}`
      );

      console.log(
        "Price update data fetched, length:",
        priceFeedUpdateData.length
      );
      console.log(
        "First update (truncated):",
        priceFeedUpdateData[0].substring(0, 66) + "..."
      );
      console.log("Has 0x prefix:", priceFeedUpdateData[0].startsWith("0x"));

      // Since your Stapal contract calls pyth.getUpdateFee() and pyth.updatePriceFeeds() internally,
      // we need to send enough ETH to cover the Pyth update fee.
      // Sending 0.01 ETH to be safe
      const valueToSend = BigInt("10000000000000000"); // 0.01 ETH in wei
      console.log(
        "Sending value with transaction:",
        valueToSend.toString(),
        "wei (0.01 ETH)"
      );

      console.log("Calling updatePriceAndDistribute...");
      const hash3 = await client.writeContract({
        address: CONTRACT_ADDRESSES.STAPAL,
        abi: STAPAL_ABI,
        functionName: "updatePriceAndDistribute",
        args: [priceFeedUpdateData as `0x${string}`[]],
        value: valueToSend,
      });
      console.log("Transaction hash:", hash3);

      console.log("Waiting for confirmation...");
      await client.waitForTransactionReceipt({ hash: hash3 });
      console.log("Transaction confirmed!");

      updates[3].status = "completed";
      updates[3].txHash = hash3;
    } catch (error) {
      console.error("Step 3 error:", error);
      updates[3].status = "error";
      updates[3].message =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json({ updates }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updates,
      message: "Draw process completed successfully!",
    });
  } catch (error) {
    console.error("Draw API error:", error);
    return NextResponse.json(
      {
        error: "Failed to execute draw process",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
