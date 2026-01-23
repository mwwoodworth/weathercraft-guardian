"use client";

import { useState, useMemo } from "react";
import { MATERIALS, checkCompliance, type Material } from "@/lib/materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Box,
  Truck,
  Snowflake,
  Flame,
  BarChart3,
  Trash2,
  Activity,
  ShoppingCart,
  Timer,
  ChevronDown,
  ChevronRight,
  Info
} from "lucide-react";

// Mock inventory data - in production would come from database
type InventoryItem = {
  materialId: string;
  quantity: number;
  unit: string;
  reorderPoint: number;
  maxCapacity: number;
  onOrder: number;
  expectedDelivery?: Date;
  lastDelivery?: Date;
  storageTemp?: number;
  conditioningRequired?: boolean;
  conditioningStartTime?: Date;
  conditioningDuration?: number; // minutes needed
};

type UsageEntry = {
  materialId: string;
  date: Date;
  quantity: number;
  area?: string;
  waste?: number;
};

// Demo inventory data
const MOCK_INVENTORY: InventoryItem[] = [
  {
    materialId: "green-lock-plus",
    quantity: 45,
    unit: "pails",
    reorderPoint: 20,
    maxCapacity: 100,
    onOrder: 30,
    expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    lastDelivery: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    storageTemp: 62,
  },
  {
    materialId: "r-mer-seal",
    quantity: 8,
    unit: "rolls",
    reorderPoint: 15,
    maxCapacity: 50,
    onOrder: 25,
    expectedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    storageTemp: 55,
  },
  {
    materialId: "garla-block-2k",
    quantity: 25,
    unit: "pails",
    reorderPoint: 10,
    maxCapacity: 60,
    onOrder: 0,
    storageTemp: 58,
  },
  {
    materialId: "garla-flex",
    quantity: 32,
    unit: "tubes",
    reorderPoint: 15,
    maxCapacity: 80,
    onOrder: 0,
    storageTemp: 65,
    conditioningRequired: true,
    conditioningStartTime: new Date(Date.now() - 45 * 60 * 1000),
    conditioningDuration: 120,
  },
  {
    materialId: "tuff-stuff-ms",
    quantity: 48,
    unit: "tubes",
    reorderPoint: 20,
    maxCapacity: 100,
    onOrder: 0,
    storageTemp: 72,
  },
  {
    materialId: "optimax-membrane",
    quantity: 12,
    unit: "rolls",
    reorderPoint: 20,
    maxCapacity: 60,
    onOrder: 20,
    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    storageTemp: 48,
    conditioningRequired: true,
    conditioningStartTime: new Date(Date.now() - 30 * 60 * 1000),
    conditioningDuration: 90,
  },
  {
    materialId: "pyramic-plus-lo",
    quantity: 18,
    unit: "pails",
    reorderPoint: 10,
    maxCapacity: 40,
    onOrder: 0,
    storageTemp: 55,
  },
  {
    materialId: "tuff-flash-plus",
    quantity: 22,
    unit: "pails",
    reorderPoint: 12,
    maxCapacity: 50,
    onOrder: 0,
    storageTemp: 60,
  },
];

// Mock usage data for the week
const MOCK_USAGE: UsageEntry[] = [
  { materialId: "green-lock-plus", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), quantity: 8, area: "Area A North", waste: 0.5 },
  { materialId: "green-lock-plus", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), quantity: 10, area: "Area A Center", waste: 0.8 },
  { materialId: "green-lock-plus", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), quantity: 0, area: "Weather Hold", waste: 0 },
  { materialId: "green-lock-plus", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), quantity: 7, area: "Area A South", waste: 0.3 },
  { materialId: "green-lock-plus", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), quantity: 5, area: "Area A Finish", waste: 0.2 },
  { materialId: "green-lock-plus", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), quantity: 0, area: "Weekend", waste: 0 },
  { materialId: "green-lock-plus", date: new Date(), quantity: 6, area: "Area B Start", waste: 0.4 },
  { materialId: "optimax-membrane", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), quantity: 4, area: "Area A North", waste: 0.2 },
  { materialId: "optimax-membrane", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), quantity: 5, area: "Area A Center", waste: 0.3 },
  { materialId: "optimax-membrane", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), quantity: 3, area: "Area A South", waste: 0.1 },
  { materialId: "optimax-membrane", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), quantity: 4, area: "Area A Finish", waste: 0.2 },
  { materialId: "optimax-membrane", date: new Date(), quantity: 3, area: "Area B Start", waste: 0.1 },
  { materialId: "garla-flex", date: new Date(), quantity: 6, area: "Flashings", waste: 0.5 },
  { materialId: "tuff-stuff-ms", date: new Date(), quantity: 8, area: "Sealing", waste: 0.3 },
];

type MaterialTrackerProps = {
  currentTemp: number;
  windSpeed: number;
  isPrecipitating: boolean;
  tempTrend?: "rising" | "falling" | "stable";
};

export default function MaterialTracker({
  currentTemp,
  windSpeed,
  isPrecipitating,
  tempTrend
}: MaterialTrackerProps) {
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"cards" | "inventory" | "usage">("cards");
  // Use state with initializer function for consistent time reference
  const [currentTime] = useState(() => Date.now());

  const toggleMaterial = (id: string) => {
    const next = new Set(expandedMaterials);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMaterials(next);
  };

  // Calculate compliance for all materials
  const materialCompliance = useMemo(() => {
    return MATERIALS.map(material => ({
      material,
      compliance: checkCompliance(material.id, currentTemp, windSpeed, isPrecipitating, tempTrend),
      inventory: MOCK_INVENTORY.find(i => i.materialId === material.id)
    }));
  }, [currentTemp, windSpeed, isPrecipitating, tempTrend]);

  const goCount = materialCompliance.filter(m => m.compliance.compliant).length;
  const lowStockCount = MOCK_INVENTORY.filter(i => i.quantity <= i.reorderPoint).length;
  const conditioningCount = MOCK_INVENTORY.filter(i => i.conditioningRequired).length;

  // Use currentTime for date calculations
  const todayString = new Date(currentTime).toDateString();

  // Calculate today's usage
  const todayUsage = MOCK_USAGE.filter(u =>
    u.date.toDateString() === todayString
  );
  const todayTotal = todayUsage.reduce((sum, u) => sum + u.quantity, 0);
  const todayWaste = todayUsage.reduce((sum, u) => sum + (u.waste || 0), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <Package className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Material Inventory Tracker</h2>
            <p className="text-sm text-muted-foreground">Real-time inventory, compliance, and conditioning status</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            Compliance
          </button>
          <button
            onClick={() => setViewMode("inventory")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === "inventory" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setViewMode("usage")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === "usage" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            Usage
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={goCount === MATERIALS.length ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${goCount === MATERIALS.length ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
              <CheckCircle2 className={`w-5 h-5 ${goCount === MATERIALS.length ? "text-emerald-500" : "text-amber-500"}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{goCount}/{MATERIALS.length}</div>
              <div className="text-sm text-muted-foreground">Materials GO</div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${lowStockCount > 0 ? "bg-rose-500/20" : "bg-emerald-500/20"}`}>
              <Box className={`w-5 h-5 ${lowStockCount > 0 ? "text-rose-500" : "text-emerald-500"}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{lowStockCount}</div>
              <div className="text-sm text-muted-foreground">Low Stock</div>
            </div>
          </CardContent>
        </Card>
        <Card className={conditioningCount > 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-muted/30"}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${conditioningCount > 0 ? "bg-blue-500/20" : "bg-muted"}`}>
              <Timer className={`w-5 h-5 ${conditioningCount > 0 ? "text-blue-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{conditioningCount}</div>
              <div className="text-sm text-muted-foreground">Conditioning</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">{todayTotal}</div>
              <div className="text-sm text-muted-foreground">Used Today</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT */}
      {viewMode === "cards" && (
        <MaterialComplianceView
          materialCompliance={materialCompliance}
          expandedMaterials={expandedMaterials}
          toggleMaterial={toggleMaterial}
          currentTemp={currentTemp}
          currentTime={currentTime}
        />
      )}

      {viewMode === "inventory" && (
        <InventoryView
          inventory={MOCK_INVENTORY}
          materials={MATERIALS}
          currentTime={currentTime}
        />
      )}

      {viewMode === "usage" && (
        <UsageView
          usage={MOCK_USAGE}
          materials={MATERIALS}
          todayTotal={todayTotal}
          todayWaste={todayWaste}
          currentTime={currentTime}
        />
      )}
    </div>
  );
}

// ========== MATERIAL COMPLIANCE VIEW ==========
function MaterialComplianceView({
  materialCompliance,
  expandedMaterials,
  toggleMaterial,
  currentTemp,
  currentTime
}: {
  materialCompliance: Array<{
    material: Material;
    compliance: { compliant: boolean; reasons: string[] };
    inventory?: InventoryItem;
  }>;
  expandedMaterials: Set<string>;
  toggleMaterial: (id: string) => void;
  currentTemp: number;
  currentTime: number;
}) {
  return (
    <div className="space-y-4">
      {/* Temperature Warning Banner */}
      {currentTemp < 40 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Snowflake className="w-6 h-6 text-amber-400" />
            <div>
              <div className="font-semibold text-amber-400">Cold Weather Alert</div>
              <div className="text-sm text-muted-foreground">
                Current temperature ({Math.round(currentTemp)}F) requires material conditioning. Check storage temps and conditioning status.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {materialCompliance.map(({ material, compliance, inventory }) => (
          <MaterialCard
            key={material.id}
            material={material}
            compliance={compliance}
            inventory={inventory}
            expanded={expandedMaterials.has(material.id)}
            onToggle={() => toggleMaterial(material.id)}
            currentTemp={currentTemp}
            currentTime={currentTime}
          />
        ))}
      </div>
    </div>
  );
}

function MaterialCard({
  material,
  compliance,
  inventory,
  expanded,
  onToggle,
  currentTemp,
  currentTime
}: {
  material: Material;
  compliance: { compliant: boolean; reasons: string[] };
  inventory?: InventoryItem;
  expanded: boolean;
  onToggle: () => void;
  currentTemp: number;
  currentTime: number;
}) {
  const needsConditioning = inventory?.conditioningRequired && !compliance.compliant;
  const storageAtRisk = inventory?.storageTemp !== undefined &&
    ((material.constraints.storageTempMin && inventory.storageTemp < material.constraints.storageTempMin) ||
     (material.constraints.storageTempMax && inventory.storageTemp > material.constraints.storageTempMax));

  const conditioningProgress = inventory?.conditioningStartTime && inventory?.conditioningDuration
    ? Math.min(100, ((currentTime - inventory.conditioningStartTime.getTime()) / (inventory.conditioningDuration * 60 * 1000)) * 100)
    : 0;

  const conditioningRemaining = inventory?.conditioningStartTime && inventory?.conditioningDuration
    ? Math.max(0, inventory.conditioningDuration - Math.floor((currentTime - inventory.conditioningStartTime.getTime()) / 60000))
    : 0;

  return (
    <Card className={`transition-all ${compliance.compliant ? "border-emerald-500/30 hover:border-emerald-500/50" : "border-rose-500/30 hover:border-rose-500/50"}`}>
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {expanded ? <ChevronDown className="w-4 h-4 mt-1" /> : <ChevronRight className="w-4 h-4 mt-1" />}
              <div>
                <CardTitle className="text-sm font-semibold">{material.name}</CardTitle>
                <div className="text-xs text-muted-foreground">{material.category}</div>
              </div>
            </div>
            <Badge className={compliance.compliant ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}>
              {compliance.compliant ? "GO" : "NO-GO"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Status Icons Row */}
          <div className="flex items-center gap-2 mb-3">
            {compliance.compliant ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
            {needsConditioning && (
              <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                <Timer className="w-3 h-3 mr-1" />
                Conditioning
              </Badge>
            )}
            {storageAtRisk && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Storage Risk
              </Badge>
            )}
            {inventory && inventory.quantity <= inventory.reorderPoint && (
              <Badge variant="outline" className="text-xs border-rose-500/50 text-rose-400">
                <Box className="w-3 h-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </div>

          {/* Conditioning Progress */}
          {inventory?.conditioningRequired && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Conditioning Progress</span>
                <span className="font-mono">
                  {conditioningRemaining > 0 ? `${conditioningRemaining}m remaining` : "Ready"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${conditioningProgress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                  style={{ width: `${conditioningProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Violations */}
          {!compliance.compliant && (
            <div className="space-y-1">
              {compliance.reasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-rose-400">
                  <XCircle className="w-3 h-3 flex-shrink-0" />
                  {reason}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-muted/20">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Constraints */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Requirements</div>
              <div className="space-y-1 text-sm">
                {material.constraints.minTemp !== undefined && (
                  <div className="flex items-center gap-2">
                    <Thermometer className={`w-3 h-3 ${currentTemp >= material.constraints.minTemp ? "text-emerald-400" : "text-rose-400"}`} />
                    <span>Min Temp: {material.constraints.minTemp}F</span>
                  </div>
                )}
                {material.constraints.maxTemp !== undefined && (
                  <div className="flex items-center gap-2">
                    <Thermometer className={`w-3 h-3 ${currentTemp <= material.constraints.maxTemp ? "text-emerald-400" : "text-rose-400"}`} />
                    <span>Max Temp: {material.constraints.maxTemp}F</span>
                  </div>
                )}
                {material.constraints.rising && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <span>Temp must be rising</span>
                  </div>
                )}
                {material.constraints.noPrecip && (
                  <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-muted-foreground" />
                    <span>No precipitation allowed</span>
                  </div>
                )}
                {material.constraints.storageTempMin !== undefined && (
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-3 h-3 text-blue-400" />
                    <span>Storage Min: {material.constraints.storageTempMin}F</span>
                  </div>
                )}
                {material.constraints.storageTempMax !== undefined && (
                  <div className="flex items-center gap-2">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>Storage Max: {material.constraints.storageTempMax}F</span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Info */}
            {inventory && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Storage Status</div>
                <div className="space-y-1 text-sm">
                  {inventory.storageTemp !== undefined && (
                    <div className="flex items-center gap-2">
                      <Thermometer className={`w-3 h-3 ${storageAtRisk ? "text-amber-400" : "text-emerald-400"}`} />
                      <span>Current: {inventory.storageTemp}F</span>
                      {storageAtRisk && <Badge variant="outline" className="text-xs text-amber-400">At Risk</Badge>}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Box className="w-3 h-3 text-muted-foreground" />
                    <span>{inventory.quantity} {inventory.unit} in stock</span>
                  </div>
                  {inventory.onOrder > 0 && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-3 h-3 text-blue-400" />
                      <span>{inventory.onOrder} {inventory.unit} on order</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">{material.description}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// ========== INVENTORY VIEW ==========
function InventoryView({
  inventory,
  materials,
  currentTime
}: {
  inventory: InventoryItem[];
  materials: Material[];
  currentTime: number;
}) {
  const getMaterial = (id: string) => materials.find(m => m.id === id);
  const sortedInventory = [...inventory].sort((a, b) => {
    // Sort by stock level ratio (lowest first)
    const ratioA = a.quantity / a.reorderPoint;
    const ratioB = b.quantity / b.reorderPoint;
    return ratioA - ratioB;
  });

  return (
    <div className="space-y-6">
      {/* Pending Deliveries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Truck className="w-4 h-4 text-blue-400" />
            Pending Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inventory.filter(i => i.onOrder > 0 && i.expectedDelivery).map(item => {
              const material = getMaterial(item.materialId);
              if (!material) return null;
              const daysUntil = Math.ceil((item.expectedDelivery!.getTime() - currentTime) / (24 * 60 * 60 * 1000));
              return (
                <div key={item.materialId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-medium text-sm">{material.name}</div>
                      <div className="text-xs text-muted-foreground">{item.onOrder} {item.unit}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-blue-400">
                      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.expectedDelivery!.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
            {inventory.filter(i => i.onOrder > 0).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">No pending deliveries</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Levels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Box className="w-4 h-4 text-primary" />
            Inventory Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedInventory.map(item => {
              const material = getMaterial(item.materialId);
              if (!material) return null;
              const percentage = (item.quantity / item.maxCapacity) * 100;
              const isLow = item.quantity <= item.reorderPoint;
              const isCritical = item.quantity <= item.reorderPoint * 0.5;

              return (
                <div key={item.materialId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{material.name}</span>
                      {isLow && (
                        <Badge variant="outline" className={`text-xs ${isCritical ? "text-rose-400 border-rose-500/50" : "text-amber-400 border-amber-500/50"}`}>
                          {isCritical ? "Critical" : "Low"}
                        </Badge>
                      )}
                      {item.onOrder > 0 && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/50">
                          +{item.onOrder} ordered
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-mono">
                      {item.quantity}/{item.maxCapacity} {item.unit}
                    </span>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    {/* Reorder point marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-500/50 z-10"
                      style={{ left: `${(item.reorderPoint / item.maxCapacity) * 100}%` }}
                    />
                    {/* Current level */}
                    <div
                      className={`h-full transition-all ${isCritical ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${percentage}%` }}
                    />
                    {/* On order (projected) */}
                    {item.onOrder > 0 && (
                      <div
                        className="absolute top-0 h-full bg-blue-500/30 border-l border-blue-500"
                        style={{
                          left: `${percentage}%`,
                          width: `${Math.min((item.onOrder / item.maxCapacity) * 100, 100 - percentage)}%`
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reorder at {item.reorderPoint}</span>
                    {item.storageTemp !== undefined && (
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        {item.storageTemp}F
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== USAGE VIEW ==========
function UsageView({
  usage,
  materials,
  todayTotal,
  todayWaste,
  currentTime
}: {
  usage: UsageEntry[];
  materials: Material[];
  todayTotal: number;
  todayWaste: number;
  currentTime: number;
}) {
  const getMaterial = (id: string) => materials.find(m => m.id === id);
  const todayString = new Date(currentTime).toDateString();

  // Group usage by day for the chart
  const dailyUsage = useMemo(() => {
    const days: { date: string; total: number; waste: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentTime - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayUsage = usage.filter(u => u.date.toDateString() === date.toDateString());
      days.push({
        date: dateStr,
        total: dayUsage.reduce((sum, u) => sum + u.quantity, 0),
        waste: dayUsage.reduce((sum, u) => sum + (u.waste || 0), 0)
      });
    }
    return days;
  }, [usage, currentTime]);

  const maxUsage = Math.max(...dailyUsage.map(d => d.total), 1);
  const weeklyTotal = dailyUsage.reduce((sum, d) => sum + d.total, 0);
  const weeklyWaste = dailyUsage.reduce((sum, d) => sum + d.waste, 0);
  const wastePercentage = weeklyTotal > 0 ? ((weeklyWaste / weeklyTotal) * 100).toFixed(1) : "0";

  // Group today's usage by material
  const todayByMaterial = useMemo(() => {
    const grouped = new Map<string, { quantity: number; waste: number; areas: string[] }>();
    usage.filter(u => u.date.toDateString() === todayString).forEach(u => {
      const existing = grouped.get(u.materialId) || { quantity: 0, waste: 0, areas: [] };
      existing.quantity += u.quantity;
      existing.waste += u.waste || 0;
      if (u.area) existing.areas.push(u.area);
      grouped.set(u.materialId, existing);
    });
    return grouped;
  }, [usage, todayString]);

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-400" />
              <div>
                <div className="text-3xl font-bold">{todayTotal}</div>
                <div className="text-sm text-muted-foreground">Units Used Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-amber-400" />
              <div>
                <div className="text-3xl font-bold">{todayWaste.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Waste Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-3xl font-bold">{wastePercentage}%</div>
                <div className="text-sm text-muted-foreground">Weekly Waste Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Weekly Consumption
            </span>
            <span className="text-muted-foreground font-normal">Total: {weeklyTotal} units</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {dailyUsage.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {day.waste > 0 && (
                    <div
                      className="w-full max-w-8 bg-amber-500/50 rounded-t"
                      style={{ height: `${(day.waste / maxUsage) * 100}%` }}
                    />
                  )}
                  <div
                    className={`w-full max-w-8 rounded-t ${day.total === 0 ? "bg-muted" : "bg-emerald-500"}`}
                    style={{ height: `${Math.max((day.total / maxUsage) * 100, 4)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">{day.date}</div>
                <div className="text-xs font-mono">{day.total}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-muted-foreground">Used</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded bg-amber-500/50" />
              <span className="text-muted-foreground">Waste</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            Today&apos;s Material Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayByMaterial.size > 0 ? (
            <div className="space-y-3">
              {Array.from(todayByMaterial.entries()).map(([materialId, data]) => {
                const material = getMaterial(materialId);
                if (!material) return null;
                return (
                  <div key={materialId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-medium text-sm">{material.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.areas.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{data.quantity} units</div>
                      {data.waste > 0 && (
                        <div className="text-xs text-amber-400">{data.waste.toFixed(1)} waste</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div>No usage recorded today</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
