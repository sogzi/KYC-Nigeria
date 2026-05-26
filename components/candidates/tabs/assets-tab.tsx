import { ExternalLink, Home, Car, Wallet, TrendingDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNaira } from '@/lib/party-config';
import type { AssetDeclaration, PropertyEntry, VehicleEntry, CashEntry, LiabilityEntry } from '@/types';

interface Props {
  declarations: AssetDeclaration[];
}

/** Simple horizontal bar chart using pure CSS. */
function AssetBar({
  label,
  value,
  total,
  colour,
  icon: Icon,
}: {
  label: string;
  value: number;
  total: number;
  colour: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Icon className={`h-4 w-4 ${colour}`} />
          {label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {formatNaira(value)}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${colour.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DeclarationCard({ declaration }: { declaration: AssetDeclaration }) {
  const properties = (declaration.properties as PropertyEntry[]) ?? [];
  const vehicles = (declaration.vehicles as VehicleEntry[]) ?? [];
  const cash = (declaration.cash as CashEntry[]) ?? [];
  const liabilities = (declaration.liabilities as LiabilityEntry[]) ?? [];

  const propertiesTotal = properties.reduce(
    (s, p) => s + (p.estimated_value_naira ?? 0),
    0,
  );
  const vehiclesTotal = vehicles.reduce(
    (s, v) => s + (v.estimated_value_naira ?? 0),
    0,
  );
  const cashTotal = cash.reduce((s, c) => s + (c.currency === 'NGN' ? c.amount : 0), 0);
  const liabilitiesTotal = liabilities.reduce((s, l) => s + l.amount_naira, 0);

  const grossAssets =
    declaration.total_assets_naira ??
    propertiesTotal + vehiclesTotal + cashTotal;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">
            {declaration.declaration_year} Declaration
          </CardTitle>
          <div className="flex items-center gap-2">
            {declaration.verified && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                ✓ Verified
              </span>
            )}
            {declaration.source_url && (
              <a
                href={declaration.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Total headline */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Total Declared Assets
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {formatNaira(grossAssets)}
          </p>
          {liabilitiesTotal > 0 && (
            <p className="mt-1 text-sm text-red-600">
              − {formatNaira(liabilitiesTotal)} liabilities
            </p>
          )}
        </div>

        {/* Visual breakdown */}
        {grossAssets > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Asset breakdown</h4>
            {propertiesTotal > 0 && (
              <AssetBar
                label="Properties"
                value={propertiesTotal}
                total={grossAssets}
                colour="text-blue-600"
                icon={Home}
              />
            )}
            {vehiclesTotal > 0 && (
              <AssetBar
                label="Vehicles"
                value={vehiclesTotal}
                total={grossAssets}
                colour="text-purple-600"
                icon={Car}
              />
            )}
            {cashTotal > 0 && (
              <AssetBar
                label="Cash (₦)"
                value={cashTotal}
                total={grossAssets}
                colour="text-green-600"
                icon={Wallet}
              />
            )}
            {liabilitiesTotal > 0 && (
              <AssetBar
                label="Liabilities"
                value={liabilitiesTotal}
                total={grossAssets}
                colour="text-red-500"
                icon={TrendingDown}
              />
            )}
          </div>
        )}

        {/* Properties list */}
        {properties.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
              <Home className="h-4 w-4 text-blue-600" /> Properties ({properties.length})
            </h4>
            <ul className="space-y-1.5">
              {properties.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground flex justify-between gap-2">
                  <span>{p.description} — {p.location}</span>
                  {p.estimated_value_naira && (
                    <span className="shrink-0 font-medium text-foreground">
                      {formatNaira(p.estimated_value_naira)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vehicles list */}
        {vehicles.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5">
              <Car className="h-4 w-4 text-purple-600" /> Vehicles ({vehicles.length})
            </h4>
            <ul className="space-y-1.5">
              {vehicles.map((v, i) => (
                <li key={i} className="text-sm text-muted-foreground flex justify-between gap-2">
                  <span>
                    {v.year ? `${v.year} ` : ''}{v.make} {v.model}
                  </span>
                  {v.estimated_value_naira && (
                    <span className="shrink-0 font-medium text-foreground">
                      {formatNaira(v.estimated_value_naira)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Liabilities list */}
        {liabilities.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold flex items-center gap-1.5 text-red-600">
              <TrendingDown className="h-4 w-4" /> Liabilities ({liabilities.length})
            </h4>
            <ul className="space-y-1.5">
              {liabilities.map((l, i) => (
                <li key={i} className="text-sm text-muted-foreground flex justify-between gap-2">
                  <span>{l.description} — {l.creditor}</span>
                  <span className="shrink-0 font-medium text-red-600">
                    {formatNaira(l.amount_naira)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AssetsTab({ declarations }: Props) {
  if (!declarations.length) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Asset declaration not available</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          This candidate has not submitted an asset declaration, or it hasn't
          been added to our database yet.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <a
            href="https://www.inecnigeria.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Request via INEC
          </a>
          <a
            href="https://efccnigeria.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Check EFCC records
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {declarations.map((d) => (
        <DeclarationCard key={d.id} declaration={d} />
      ))}
    </div>
  );
}
