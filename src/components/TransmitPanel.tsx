import type { Format } from "../types";

type TransmitPanelProps = {
  connected: boolean;
  input: string;
  format: Format;
  onInputChange: (input: string) => void;
  onFormatChange: (format: Format) => void;
  onSend: () => void;
};

export function TransmitPanel({ connected, input, format, onInputChange, onFormatChange, onSend }: TransmitPanelProps) {
  const placeholder = format === "ascii"
    ? "送信するテキストを入力"
    : format === "hex" ? "例: 48 65 6C 6C 6F" : "例: 01001000 01101001";

  return (
    <section className="panel transmit-panel">
      <div className="section-title">データ送信</div>
      <div className="send-row">
        <textarea value={input} onChange={(event) => onInputChange(event.target.value)} placeholder={placeholder} />
        <label className="format-select">入力形式
          <select value={format} onChange={(event) => onFormatChange(event.target.value as Format)}>
            <option value="hex">Hex</option>
            <option value="bin">Bin</option>
            <option value="ascii">Ascii</option>
          </select>
        </label>
        <button className="send-button" disabled={!connected} onClick={onSend}>送信</button>
      </div>
    </section>
  );
}
