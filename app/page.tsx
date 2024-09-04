"use client";

import React, { useEffect, useState } from "react";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { AccountLayout, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Token } from "@/types";
import { handleTokenMetadata } from "@/utils";
import toast from "react-hot-toast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Modal from "@/components/Modal";

const WalletMultiButtonDynamic = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, { ssr: false });

const HomePage = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const getTokenAccounts = async () => {
    if (!publicKey) return;
    setTokens([]);
    const toastId = toast.loading("Loading Tokens");
    try {
      const balance = await connection.getBalance(publicKey);
      const tokenAccounts = await connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID });
      const tokens = tokenAccounts.value.map((tokenAccountInfo) => {
        const accountData = AccountLayout.decode(tokenAccountInfo.account.data);
        return {
          tokenAddress: new PublicKey(accountData.mint).toBase58(),
          amount: accountData.amount.toString(),
        };
      });
      const tokenList: Token[] = [];
      tokens.map(async (token) => {
        const newToken: Token = { name: "Unknown Token", symbol: "UKT", hasImage: false, image: "", amount: parseInt(token.amount) / LAMPORTS_PER_SOL, tokenAddress: token.tokenAddress };
        tokenList.push(newToken);
      });

      const tokensWithMetadata = await handleTokenMetadata(tokenList, connection);
      const solanaToken: Token = { name: "Solana", amount: balance / LAMPORTS_PER_SOL, hasImage: true, image: "/images/solana-logo.png", symbol: "SOL", tokenAddress: "" };
      setTokens([solanaToken, ...tokensWithMetadata]);
      toast.success("Tokens fetched successfully", { id: toastId });
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong, please check logs", { id: toastId });
    }
  };

  useEffect(() => {
    if (publicKey) getTokenAccounts();
    else setTokens([]);
  }, [publicKey]);

  return (
    <main className="w-screen min-h-screen flex flex-col items-center p-10 bg-[#f8f7f9]">
      <div className="w-full flex flex-col items-center lg:mt-20">
        <h1 className="text-7xl lg:text-8xl text-gray-950 font-extrabold tracking-tight">SolaBoard</h1>
        <p className="text-2xl lg:text-4xl text-center">A Dashboard for interacting with your solana tokens</p>
        <div className="mt-5">
          <WalletMultiButtonDynamic />
        </div>
      </div>
      <div className="w-full lg:w-1/2 mt-10 flex flex-col gap-4">
        {tokens.map((token, idx) => (
          <div key={token.tokenAddress} className="w-full rounded-xl flex justify-between p-4 shadow-lg items-center border">
            <div className="flex gap-4 items-center">
              {!token.hasImage && <div className="rounded-full px-4 h-12 w-12 bg-gray-200 flex justify-center items-center font-semibold">{token.symbol}</div>}
              {token.hasImage && <img src={token.image} alt="token-image" className="w-12 h-12 rounded-full" />}
              <div className="w-full flex-grow">
                <p>{token.name}</p>
                <p className="w-4/6 md:hidden text-xs font-thin overflow-clip text-ellipsis">{token.tokenAddress.substring(0, 40)}</p>
                <p className="hidden md:block w-full text-xs font-thin">{token.tokenAddress}</p>
                <p className="md:hidden">
                  {token.amount} {token.symbol}
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-4 items-center">
              <p>
                {token.amount} {token.symbol}
              </p>
              {/* <Modal onOpenBtnClick={() => setSelectedToken(token)} selectedToken={selectedToken} /> */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default HomePage;
