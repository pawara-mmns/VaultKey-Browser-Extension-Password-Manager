import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { PageHeader } from "../components/PageHeader";
import { scheduleAutoLock } from "../services/activityService";
import { parseBackup } from "../services/backupService";
import { cancelClipboardProtection, hasClipboardProtectionPermission, requestClipboardProtectionPermission, rescheduleClipboardProtection } from "../services/clipboardService";
import { getDefaultSettings, loadSettings, saveSettings } from "../services/settingsService";
import { BackupDialog, ChangeMasterPasswordDialog, ResetVaultDialog, RestoreDialog } from "../settings/SecurityDialogs";
import type { VaultKeySettings } from "../types/settings";

type DialogState = "change-password" | "backup" | "reset" | { kind: "restore"; serialized: string; fileName: string } | null;
const autoLockLabels = new Map<number | null, string>([[1, "1 minute"], [5, "5 minutes"], [10, "10 minutes"], [15, "15 minutes"], [30, "30 minutes"], [null, "Never"]]);
const clipboardLabels = new Map<number | null, string>([[30, "30 seconds"], [60, "60 seconds"], [120, "2 minutes"], [300, "5 minutes"], [null, "Never"]]);

export function SettingsPage() {
  const [settings, setSettings] = useState<VaultKeySettings>(getDefaultSettings);
  const [loading, setLoading] = useState(true);
  const [clipboardPermission, setClipboardPermission] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const clipboardEnabled = clipboardPermission && settings.clipboardClearSeconds !== null;

  useEffect(() => {
    let mounted = true;
    void Promise.all([loadSettings(), hasClipboardProtectionPermission()]).then(([stored, permission]) => {
      if (mounted) { setSettings(stored); setClipboardPermission(permission); setLoading(false); }
    });
    return () => { mounted = false; };
  }, []);

  const persist = async (next: VaultKeySettings) => {
    const previous = settings;
    setSettings(next); setFeedback("");
    try { await saveSettings(next); return true; }
    catch { setSettings(previous); setFeedback("VaultKey could not save this setting."); return false; }
  };

  const changeAutoLock = async (value: string) => {
    const autoLockMinutes = value === "never" ? null : Number(value);
    if (await persist({ ...settings, autoLockMinutes })) { await scheduleAutoLock(); setFeedback(`Auto Lock updated to ${autoLockLabels.get(autoLockMinutes)}.`); }
  };

  const enableClipboard = async () => {
    setFeedback("");
    const granted = clipboardPermission || await requestClipboardProtectionPermission();
    setClipboardPermission(granted);
    if (!granted) { setFeedback("Clipboard protection remains disabled because permission was not granted."); return; }
    const next = { ...settings, clipboardClearSeconds: settings.clipboardClearSeconds ?? 30 };
    if (await persist(next)) setFeedback("Clipboard protection enabled. VaultKey clears only unchanged copied passwords.");
  };

  const disableClipboard = async () => {
    const next = { ...settings, clipboardClearSeconds: null };
    if (await persist(next)) { await cancelClipboardProtection(); setFeedback("Clipboard auto-clear disabled."); }
  };

  const changeClipboardTimeout = async (value: string) => {
    const clipboardClearSeconds = value === "never" ? null : Number(value);
    if (await persist({ ...settings, clipboardClearSeconds })) {
      if (clipboardClearSeconds === null) await cancelClipboardProtection();
      else await rescheduleClipboardProtection(clipboardClearSeconds);
      setFeedback(`Clipboard auto-clear updated to ${clipboardLabels.get(clipboardClearSeconds)}.`);
    }
  };

  const selectRestoreFile = async (file: File | undefined) => {
    if (!file) return;
    setFeedback("");
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("too large");
      const serialized = await file.text();
      parseBackup(serialized);
      setDialog({ kind: "restore", serialized, fileName: file.name });
    } catch { setFeedback("Select a valid VaultKey .vkbak backup file."); }
    finally { if (fileInput.current) fileInput.current.value = ""; }
  };

  return <div className="page">
    <PageHeader eyebrow="Preferences" title="Settings" description="Manage local VaultKey security, clipboard protection, encrypted backups, and destructive reset controls." />
    {feedback && <p className="settings-feedback" role="status">{feedback}</p>}
    <div className="settings-management">
      <section className="content-card settings-group">
        <div className="section-heading"><div><span className="eyebrow">Security</span><h2>Vault session</h2></div></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="lock" size={20} /></div><div><strong>Auto Lock</strong><span>Lock VaultKey after inactivity inside the extension.</span></div><select aria-label="Auto Lock timeout" disabled={loading} value={settings.autoLockMinutes ?? "never"} onChange={(event) => void changeAutoLock(event.target.value)}>{[1,5,10,15,30].map((value) => <option key={value} value={value}>{autoLockLabels.get(value)}</option>)}<option value="never">Never</option></select></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="key" size={20} /></div><div><strong>Change Master Password</strong><span>Re-wrap the same Vault Key with a fresh salt and wrapping IV.</span></div><Button variant="secondary" onClick={() => setDialog("change-password")}>Change Master Password</Button></div>
      </section>
      <section className="content-card settings-group">
        <div className="section-heading"><div><span className="eyebrow">Clipboard protection</span><h2>Copied passwords</h2></div></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="copy" size={20} /></div><div><strong>Clear copied passwords after</strong><span>VaultKey checks a SHA-256 fingerprint first, so newer clipboard content remains untouched.</span></div><select aria-label="Clipboard clear timeout" disabled={!clipboardEnabled} value={settings.clipboardClearSeconds ?? "never"} onChange={(event) => void changeClipboardTimeout(event.target.value)}>{[30,60,120,300].map((value) => <option key={value} value={value}>{clipboardLabels.get(value)}</option>)}<option value="never">Never</option></select></div>
        <div className="settings-permission-note"><Icon name="shield" size={17} /><p>Optional clipboard access is used only to verify and remove passwords copied by VaultKey.</p>{!clipboardEnabled ? <Button size="small" onClick={() => void enableClipboard()}>Enable Protection</Button> : <Button size="small" variant="secondary" onClick={() => void disableClipboard()}>Disable Protection</Button>}</div>
      </section>
      <section className="content-card settings-group">
        <div className="section-heading"><div><span className="eyebrow">Data</span><h2>Encrypted local backup</h2></div></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="vault" size={20} /></div><div><strong>Create Encrypted Backup</strong><span>Export a metadata-hiding AES-GCM .vkbak file.</span></div><Button variant="secondary" onClick={() => setDialog("backup")}>Create Backup</Button></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="arrow" size={20} /></div><div><strong>Restore Backup</strong><span>Validate and decrypt fully before replacing current local data.</span></div><Button variant="secondary" onClick={() => fileInput.current?.click()}>Restore Backup</Button><input ref={fileInput} className="visually-hidden" type="file" accept=".vkbak" onChange={(event) => void selectRestoreFile(event.target.files?.[0])} /></div>
      </section>
      <section className="content-card settings-group settings-group--danger">
        <div className="section-heading"><div><span className="eyebrow">Danger zone</span><h2>Reset Local Vault</h2></div></div>
        <div className="settings-control-row"><div className="settings-card__icon"><Icon name="delete" size={20} /></div><div><strong>Permanently remove local VaultKey data</strong><span>This is not password recovery. Existing encrypted backup files are not deleted.</span></div><Button variant="danger" onClick={() => setDialog("reset")}>Reset Vault</Button></div>
      </section>
    </div>
    <div className="about-row"><span>VaultKey Browser</span><span>Version 1.0.0</span></div>
    {dialog === "change-password" && <ChangeMasterPasswordDialog onClose={() => setDialog(null)} />}
    {dialog === "backup" && <BackupDialog onClose={() => setDialog(null)} />}
    {dialog === "reset" && <ResetVaultDialog onClose={() => setDialog(null)} />}
    {typeof dialog === "object" && dialog?.kind === "restore" && <RestoreDialog serialized={dialog.serialized} fileName={dialog.fileName} onClose={() => setDialog(null)} />}
  </div>;
}
