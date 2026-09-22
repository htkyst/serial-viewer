import { useEffect, useRef } from "react";
import { formatBytes } from "../serialFormat";
import type { Format, Log } from "../types";

type LogPanelProps = {
  connected: boolean;
  logs: Log[];
  format: Format;
  onFormatChange: (format: Format) => void;
  onClear: () => void;
  onSave: () => void;
};

export function LogPanel({ connected, logs, format, onFormatChange, onClear, onSave }: LogPanelProps) {
  const logAreaRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    const element = logAreaRef.current;
    if (element && shouldAutoScrollRef.current) element.scrollTop = element.scrollHeight;
  }, [logs]);

  const handleScroll = () => {
    const element = logAreaRef.current;
    if (!element) return;

    shouldAutoScrollRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 10;
  };

  return (
    <section className="panel log-panel">
      <div className="log-header">
        <div className="section-title">通信ログ
          <span className={`polling ${connected ? "online" : "offline"}`}>
            <i />{connected ? "受信ポーリング中" : "ポーリング停止中"}
          </span>
        </div>
        <div>
          <label className="inline-label">表示形式
            <select value={format} onChange={(event) => onFormatChange(event.target.value as Format)}>
              <option value="hex">Hex</option>
              <option value="bin">Bin</option>
              <option value="ascii">Ascii</option>
            </select>
          </label>
          <button className="clear-button" onClick={onClear}>Clear</button>
          <button className="output-button" onClick={onSave}>Save</button>
        </div>
      </div>
      <div className="log-area" aria-live="polite" ref={logAreaRef} onScroll={handleScroll}>
        {logs.length === 0 ? <div className="empty-log" /> : logs.map((log) => (
          <div className={`log-line ${log.direction.toLowerCase()}`} key={log.id}>
            <time>{log.time}</time>
            <b>{log.direction}</b>
            <code>{log.message ?? formatBytes(log.data, format)}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
