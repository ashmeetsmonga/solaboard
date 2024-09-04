import { Token } from "./types";
import { Metaplex } from "@metaplex-foundation/js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";

export const handleTokenMetadata = async (tokenList: Token[], connection: Connection) => {
  const promises: Promise<Metadata>[] = [];
  tokenList.map((token) => promises.push(getTokenMetadata(token.tokenAddress, connection)));
  const data = await Promise.allSettled(promises);
  const uriPromises: Promise<any>[] = [];
  data.map((res, idx) => {
    if (res.status === "rejected") return;
    tokenList[idx].name = res.value.data.name;
    tokenList[idx].symbol = res.value.data.symbol;
    if (res.value.data.uri && res.value.data.uri.includes("http")) {
      uriPromises.push(getURIData(res.value.data.uri, idx));
    }
  });
  const d = await Promise.allSettled(uriPromises);
  d.map((data) => {
    if (data.status === "rejected") return;
    const idx = data.value.idx;
    if (data.value.data?.image) {
      tokenList[idx].hasImage = true;
      tokenList[idx].image = data.value.data?.image;
    }
  });
  return tokenList;
};

async function getTokenMetadata(mintAddress: string, connection: Connection) {
  const metaplex = Metaplex.make(connection);
  const metadataPda = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: new PublicKey(mintAddress) });
  const account = await Metadata.fromAccountAddress(connection, metadataPda);
  return account;
}

const getURIData = async (uri: string, idx: number) => {
  const { data } = await axios.get(uri);
  return { data, idx };
};
