import { disconnect } from "@wagmi/core";
import { TokenManager } from "./token-mananger";
import { wagmiConfig } from "../components/wallet";

async function logout() {
  TokenManager.clear();
  await disconnect(wagmiConfig);
}

export { logout };
