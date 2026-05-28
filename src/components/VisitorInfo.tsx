import { useEffect, useState } from 'react';
import { Globe, MapPin } from 'lucide-react';

interface VisitorInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
}

export function VisitorInfoCard() {
  const [info, setInfo] = useState<VisitorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((res) => res.json())
      .then((data) => {
        setInfo({
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
        });
      })
      .catch(() => {
        setInfo(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-soft)]">
        <Globe className="h-3 w-3 animate-pulse" />
        <span>检测中…</span>
      </div>
    );
  }

  if (!info) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
      <div className="flex items-center gap-1">
        <Globe className="h-3 w-3" />
        <span>{info.ip}</span>
      </div>
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        <span>{[info.city, info.region, info.country].filter(Boolean).join(', ')}</span>
      </div>
    </div>
  );
}
