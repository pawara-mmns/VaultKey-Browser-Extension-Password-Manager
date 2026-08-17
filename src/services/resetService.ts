import { STORAGE_KEYS } from "../storage/storageKeys";
import { lockVaultSession } from "./lockService";

export async function resetLocalVault(confirmation: string): Promise<void> {
  if (confirmation !== "RESET") throw new RangeError("Type RESET to confirm local vault removal.");
  await lockVaultSession("reset");
  await chrome.storage.session.remove(STORAGE_KEYS.authNotice);
  await chrome.storage.local.remove([
    STORAGE_KEYS.vaultConfig,
    STORAGE_KEYS.credentials,
    STORAGE_KEYS.settings,
  ]);
}
