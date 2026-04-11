import React from "react";

// Minimal recharts mock for jsdom testing
// ResponsiveContainer needs to render children; in jsdom it has zero size so recharts skips rendering.

export const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: 800, height: 400 }}>{children}</div>
);

export const LineChart = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

export const Line = () => null;
export const XAxis = () => null;
export const YAxis = () => null;
export const CartesianGrid = () => null;
export const Tooltip = () => null;
export const ReferenceLine = () => null;

export const Legend = ({
  formatter,
}: {
  formatter?: (value: string) => React.ReactNode;
}) => (
  <div>
    {formatter ? (
      <>
        <span>{formatter("home_wp")}</span>
        <span>{formatter("away_wp")}</span>
      </>
    ) : null}
  </div>
);
