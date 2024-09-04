"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Token } from "@/types";
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, getOrCreateAssociatedTokenAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { SignerWalletAdapterProps } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useState } from "react";
import toast from "react-hot-toast";

interface ModalProps {
  selectedToken: Token | null;
  onOpenBtnClick: () => void;
}

const Modal: React.FC<ModalProps> = ({ onOpenBtnClick, selectedToken }) => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(0);

  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const configureAndSendCurrentTransaction = async (transaction: Transaction, connection: Connection, feePayer: PublicKey, signTransaction: SignerWalletAdapterProps["signTransaction"]) => {
    const blockHash = await connection.getLatestBlockhash();
    transaction.feePayer = feePayer;
    transaction.recentBlockhash = blockHash.blockhash;
    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction({
      blockhash: blockHash.blockhash,
      lastValidBlockHeight: blockHash.lastValidBlockHeight,
      signature,
    });
    return signature;
  };

  const handleSend = async () => {
    if (!selectedToken || !publicKey || !signTransaction) {
      toast.error("Wallet not found");
      return;
    }
    const toastId = toast.loading("Processing transaction");
    try {
      const mintToken = new PublicKey(selectedToken.tokenAddress);
      const recipientKey = new PublicKey(recipient);

      const transactionInstructions: TransactionInstruction[] = [];

      const payer = new Keypair();
      const fromAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mintToken, publicKey, false, undefined, undefined, TOKEN_2022_PROGRAM_ID);

      console.log("Ashmeet 1", fromAccount);

      const associatedTokenAccountTo = await getAssociatedTokenAddress(mintToken, recipientKey);
      if (!(await connection.getAccountInfo(associatedTokenAccountTo))) {
        transactionInstructions.push(createAssociatedTokenAccountInstruction(publicKey, associatedTokenAccountTo, recipientKey, mintToken, undefined, TOKEN_2022_PROGRAM_ID));
      }

      transactionInstructions.push(createTransferInstruction(fromAccount.address, associatedTokenAccountTo, publicKey, amount * LAMPORTS_PER_SOL));
      const transaction = new Transaction().add(...transactionInstructions);
      // const signature = await configureAndSendCurrentTransaction(transaction, connection, publicKey, signTransaction);
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Confirm the transaction
      const confirmation = await connection.confirmTransaction(signature, "processed");
      toast.success("Transaction successful", { id: toastId });
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong, please check logs", { id: toastId });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Send</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle onClick={onOpenBtnClick}>Send {selectedToken?.name}</DialogTitle>
          {/* <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription> */}
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="">
            <label htmlFor="recipient" className="text-right">
              Recipient Wallet
            </label>
            <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} id="recipient" className="col-span-3" />
          </div>
          <div className="">
            <label htmlFor="amount" className="text-right">
              Amount
            </label>
            <Input type="number" value={amount} placeholder={selectedToken?.symbol} onChange={(e) => setAmount(e.target.valueAsNumber)} id="amount" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
