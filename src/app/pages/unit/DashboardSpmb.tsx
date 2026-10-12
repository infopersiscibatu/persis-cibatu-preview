import { useState } from "react";
import AntreanVerifikasi from "./AntreanVerifikasi";
import StatistikSpmb from "./StatistikSpmb";

/**
 * Dashboard Admin SPMB: antrean verifikasi teratas supaya langsung bisa
 * ditindak, lalu ringkasan statistik pendaftaran sekolah ini.
 */
export default function DashboardSpmb() {
  const [versi, setVersi] = useState(0);

  return (
    <div data-testid="spmb-dashboard">
      <StatistikSpmb
        versi={versi}
        sisipan={<AntreanVerifikasi versi={versi} onBerubah={() => setVersi((v) => v + 1)} />}
      />
    </div>
  );
}
