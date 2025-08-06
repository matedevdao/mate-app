import { wagmiConfig } from "@gaiaprotocol/client-common";
import { disconnect } from "@wagmi/core";
import { TokenManager } from "./token-mananger";
async function logout() {
    TokenManager.clear();
    await disconnect(wagmiConfig);
}
export { logout };
//# sourceMappingURL=logout.js.map