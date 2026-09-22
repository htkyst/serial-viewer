import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { LogPanel } from "./components/LogPanel";
import { SignalPanel } from "./components/SignalPanel";
import { TransmitPanel } from "./components/TransmitPanel";
import { formatBytes, toBytes } from "./serialFormat";
import type { Format, Log, PortInfo, Signals } from "./types";
import "./App.css";

const DEFAULT_BAUD_RATES = ["9600", "19200", "38400", "57600", "115200", "230400", "1000000", "2000000"];

function App() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [port, setPort] = useState("");
  const [baudRate, setBaudRate] = useState("115200");
  const [baudRateItems, setBaudRateItems] = useState(DEFAULT_BAUD_RATES);
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [sendFormat, setSendFormat] = useState<Format>("hex");
  const [displayFormat, setDisplayFormat] = useState<Format>("hex");
  const [signals, setSignals] = useState<Signals>({ rts: false, dtr: false });
  const [logs, setLogs] = useState<Log[]>([]);
  const logId = useRef(0);

  const addLog = (direction: Log["direction"], data: number[] = [], message?: string) => {
    setLogs((current) => [
      ...current.slice(-499),
      { id: ++logId.current, direction, data, message, time: new Date().toLocaleTimeString("ja-JP", { hour12: false }) },
    ]);
  };

  const refreshPorts = async () => {
    try {
      const found = await invoke<PortInfo[]>("list_serial_ports");
      setPorts(found);
      setPort((current) => current || found[0]?.name || "");
    } catch (error) {
      addLog("ERROR", [], `ポートの取得に失敗しました: ${String(error)}`);
    }
  };

  useEffect(() => {
    void refreshPorts();
  }, []);

  useEffect(() => {
    if (!connected) return;

    let stopped = false;
    const timer = window.setInterval(async () => {
      try {
        const received = await invoke<number[]>("read_serial");
        if (!stopped && received.length) addLog("RX", received);
      } catch (error) {
        if (!stopped) addLog("ERROR", [], `受信に失敗しました: ${String(error)}`);
      }
    }, 50);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [connected]);

  const addBaudRate = (newValue: string) => setBaudRateItems((current) => [...current, newValue]);

  const deleteBaudRate = (item: string) => {
    const next = baudRateItems.filter((rate) => rate !== item);
    setBaudRateItems(next);
    if (item === baudRate) setBaudRate(next[0] ?? "");
  };

  const toggleConnection = async () => {
    try {
      if (connected) {
        await invoke("close_serial_port");
        setConnected(false);
        addLog("INFO", [], "ポートを切断しました");
        return;
      }

      if (!port) throw new Error("接続するポートを選択してください");
      if (!baudRate) throw new Error("ボーレートを選択してください");

      await invoke("open_serial_port", { portName: port, baudRate: Number(baudRate) });
      setConnected(true);
      addLog("INFO", [], `${port} を ${baudRate} bps で接続しました`);
    } catch (error) {
      addLog("ERROR", [], String(error));
    }
  };

  const send = async () => {
    try {
      const bytes = toBytes(input, sendFormat);
      if (!bytes.length) return;

      await invoke("write_serial", { data: bytes });
      addLog("TX", bytes);
    } catch (error) {
      addLog("ERROR", [], String(error));
    }
  };

  const toggleSignal = async (signal: keyof Signals) => {
    const high = !signals[signal];
    try {
      await invoke("set_serial_signal", { signal, high });
      setSignals((current) => ({ ...current, [signal]: high }));
      addLog("INFO", [], `${signal.toUpperCase()} → ${high ? "ASSERT" : "DEASSERT"}`);
    } catch (error) {
      addLog("ERROR", [], `${signal.toUpperCase()}の変更に失敗しました: ${String(error)}`);
    }
  };

  const saveLogs = async () => {
    try {
      const filePath = await save({
        title: "Save Log",
        defaultPath: "serial_log.txt",
        filters: [{ name: "Text Files", extensions: ["txt"] }],
      });
      if (!filePath) return;

      const text = logs.map((log) => (
        `${log.time} [${log.direction}] ${log.message ?? formatBytes(log.data, displayFormat)}`
      )).join("\n");
      await writeTextFile(filePath, text);
      addLog("INFO", [], `ログを保存しました: ${filePath}`);
    } catch (error) {
      addLog("ERROR", [], `ログの保存に失敗しました: ${String(error)}`);
    }
  };

  return (
    <main className="app-shell">
      <header>
        <div>
          <p className="eyebrow">USB SERIAL CONSOLE</p>
        </div>
        <div className={`status ${connected ? "online" : "offline"}`}>
          <i />{connected ? "CONNECTED" : "DISCONNECTED"}
        </div>
      </header>
      <ConnectionPanel
        ports={ports}
        port={port}
        baudRate={baudRate}
        baudRateItems={baudRateItems}
        connected={connected}
        onPortChange={setPort}
        onBaudRateChange={setBaudRate}
        onAddBaudRate={addBaudRate}
        onDeleteBaudRate={deleteBaudRate}
        onRefreshPorts={() => void refreshPorts()}
        onToggleConnection={() => void toggleConnection()}
      />
      <SignalPanel connected={connected} signals={signals} onToggle={(signal) => void toggleSignal(signal)} />
      <TransmitPanel
        connected={connected}
        input={input}
        format={sendFormat}
        onInputChange={setInput}
        onFormatChange={setSendFormat}
        onSend={() => void send()}
      />
      <LogPanel
        connected={connected}
        logs={logs}
        format={displayFormat}
        onFormatChange={setDisplayFormat}
        onClear={() => setLogs([])}
        onSave={() => void saveLogs()}
      />
    </main>
  );
}

export default App;
