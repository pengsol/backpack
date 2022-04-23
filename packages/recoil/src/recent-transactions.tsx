import { atom, atomFamily, selector, selectorFamily } from "recoil";
import { Blockhash, PublicKey } from "@solana/web3.js";
import { Provider } from "@project-serum/anchor";
import { anchorContext, BackgroundSolanaConnection } from ".";
import { bootstrap } from "./bootstrap";

export const recentTransactions = atomFamily<any | null, string>({
  key: "recentTransactionsMap",
  default: selectorFamily({
    key: "recentTransactionsMapDefault",
    get:
      (address: string) =>
      async ({ get }: any) => {
        const b = get(bootstrap);
        if (b.walletPublicKey.toString() === address) {
          return b.recentTransactions;
        } else {
          const { provider } = get(anchorContext);
          return await fetchRecentTransactions(
            new PublicKey(address),
            provider
          );
        }
      },
  }),
});

/*
  effects: (address: string) => [
    ({ setSelf, getPromise }: any) => {
      // TODO: This won't reload individual tokens unless we poll in the background.
      //       Easier thing to do would be to just fetch everytime on component mount.
      setSelf(
        getPromise(bootstrap).then((b: any) => {

        })
      );
    },
  ],
	*/

export const recentBlockhash = atom<Blockhash | null>({
  key: "recentBlockhash",
  default: selector({
    key: "recentBlockhashDefault",
    get: ({ get }) => {
      const bs = get(bootstrap);
      return bs.recentBlockhash;
    },
  }),
});

export async function fetchRecentTransactions(
  publicKey: PublicKey,
  provider: Provider
) {
  const connection = new BackgroundSolanaConnection(
    "https://solana-mainnet.phantom.tech"
  );
  /*
  const connection = process.env.RPC_WITH_TX_HISTORY
    ? new BackgroundSolanaConnection(process.env.RPC_WITH_TX_HISTORY)
									 : provider.connection;
	*/

  const resp = await connection.getConfirmedSignaturesForAddress2(publicKey, {
    limit: 15,
  });

  const signatures = resp.map((s) => s.signature);
  const transactions = await connection.getParsedTransactions(signatures);
  return transactions;
}