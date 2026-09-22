import { useState } from "react";
import type { PortInfo } from "../types";

type ConnectionPanelProps = {
  ports: PortInfo[];
  port: string;
  baudRate: string;
  baudRateItems: string[];
  connected: boolean;
  onPortChange: (port: string) => void;
  onBaudRateChange: (baudRate: string) => void;
  onAddBaudRate: (baudRate: string) => void;
  onDeleteBaudRate: (baudRate: string) => void;
  onRefreshPorts: () => void;
  onToggleConnection: () => void;
};

export function ConnectionPanel({
  ports,
  port,
  baudRate,
  baudRateItems,
  connected,
  onPortChange,
  onBaudRateChange,
  onAddBaudRate,
  onDeleteBaudRate,
  onRefreshPorts,
  onToggleConnection,
}: ConnectionPanelProps) {
  const [inputBaudRate, setInputBaudRate] = useState("");
  const [baudRateMenuOpen, setBaudRateMenuOpen] = useState(false);

  const addBaudRate = () => {
    const newValue = inputBaudRate.trim();
    if (!newValue || baudRateItems.includes(newValue)) return;

    onAddBaudRate(newValue);
    setInputBaudRate("");
  };

  return (
    <section className="panel connection-panel">
      <div className="section-title">
        <span>接続設定</span>
        <button className="icon-button" onClick={onRefreshPorts} title="ポートを再検索">↻</button>
      </div>
      <div className="select-port-fields">
        <label>ポート
          <select value={port} onChange={(event) => onPortChange(event.target.value)} disabled={connected}>
            <option value="">ポートを選択</option>
            {ports.map((item) => <option key={item.name} value={item.name}>{item.name} — {item.description}</option>)}
          </select>
        </label>
      </div>
      <div className="baudrate-field">
        <div className="baudrate-control">
          <span className="baudrate-label">ボーレート</span>
          <div className="add-baudrate-row">
            <input
              className="add-input"
              type="text"
              value={inputBaudRate}
              onChange={(event) => setInputBaudRate(event.target.value)}
              placeholder="5000000" />
            <button className="add-button" onClick={addBaudRate}>追加</button>
          </div>
          <div className="baudrate-menu">
            <button
              className="baudrate-menu-trigger"
              type="button"
              onClick={() => setBaudRateMenuOpen((open) => !open)}
              disabled={connected}
              aria-expanded={baudRateMenuOpen}
              aria-haspopup="listbox">
              {baudRate || "ボーレートを選択"}<span aria-hidden="true">▾</span>
            </button>
            {baudRateMenuOpen && (
              <div className="baudrate-menu-list" role="listbox" aria-label="ボーレート">
                {baudRateItems.length ? baudRateItems.map((rate) => (
                  <div className={`baudrate-menu-item ${rate === baudRate ? "selected" : ""}`} key={rate}>
                    <button
                      className="baudrate-option"
                      type="button"
                      onClick={() => {
                        onBaudRateChange(rate);
                        setBaudRateMenuOpen(false);
                      }}
                      role="option"
                      aria-selected={rate === baudRate}>
                      {rate}
                    </button>
                    <button
                      className="delete-baudrate-button"
                      type="button"
                      onClick={() => onDeleteBaudRate(rate)}
                      title={`${rate} を削除`}>
                      削除
                    </button>
                  </div>
                )) : <p className="empty-baudrate-menu">候補がありません</p>}
              </div>
            )}
          </div>
        </div>
        <button
          className={`connect-button ${connected ? "disconnect" : ""}`}
          onClick={onToggleConnection}>
          {connected ? "切断" : "接続"}
        </button>
      </div>
    </section>
  );
}
