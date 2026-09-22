import type { Signals } from "../types";

type SignalPanelProps = {
  connected: boolean;
  signals: Signals;
  onToggle: (signal: keyof Signals) => void;
};

export function SignalPanel({ connected, signals, onToggle }: SignalPanelProps) {
  return (
    <section className="panel">
      <div className="section-title">信号制御</div>
      <div className="signal-grid">
        {(Object.keys(signals) as (keyof Signals)[]).map((signal) => (
          <button
            key={signal}
            disabled={!connected}
            className={`signal ${signals[signal] ? "high" : "low"}`}
            onClick={() => onToggle(signal)}>
            <span>{signal.toUpperCase()}</span>
            <strong>{signals[signal] ? "ASSERT" : "DEASSERT"}</strong>
            <small>{signals[signal] ? "1" : "0"}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
