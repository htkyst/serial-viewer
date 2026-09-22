export type Format = "hex" | "bin" | "ascii";

export type Log = {
  id: number;
  direction: "TX" | "RX" | "INFO" | "ERROR";
  data: number[];
  message?: string;
  time: string;
};

export type PortInfo = {
  name: string;
  description: string;
};

export type Signals = {
  rts: boolean;
  dtr: boolean;
};
