/* global window, React, Recharts */
// All page components. Attached to window.AppPages.

(function () {

const { useState, useEffect, useMemo } = React;
const {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, AreaChart, Area,
} = Recharts;

// Pull shared modules
const D = () => window.AppData;
const U = () => window.AppUtils;
const C = () => window.AppComponents;

// Color constants for charts
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];

// =================================================================
// OVERVIEW
// =================================================================
function OverviewPage({ data, setData }) {
  const { Card, Section, StatCard, Badge, HealthGauge } = C();
  const { fmtDA, fmtPct, fmtNum, computeHealth, hoursSince } = U();
  const orders = data.orders;

  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = orders.filter(o => (o.createdAt || '').slice(0, 10) === today).length;
  const pending = orders.filter(o => ['new', 'to_confirm'].includes(o.status));
  const confirmed = orders.filter(o => ['confirmed', 'shipped'].includes(o.status));
  const delivered = orders.filter(o => o.status === 'done');
  const returned = orders.filter(o => o.status === 'returned');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  const totalTouched = delivered.length + returned.length + cancelled.length + confirmed.length;
  const returnRate = (delivered.length + returned.length) > 0
    ? returned.length / (delivered.length + returned.length) : 0;
  const confirmRate = orders.length > 0
    ? (confirmed.length + delivered.length + returned.length) / (orders.length - cancelled.length || 1) : 0;

  const revenue = delivered.reduce((s, o) => s + (o.price || 0), 0);
  const estProfit = Math.round(revenue * 0.28 - returned.length * 900); // rough placeholder using 28% margin assumption
  const pendingShare = orders.length ? pending.length / orders.length : 0;

  // ROAS from sample campaigns
  const camps = data.campaigns;
  const totalSpend = camps.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = camps.reduce((s, c) => s + c.revenue, 0);
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // DSR from returns tracker
  const retData = data.returns;
  const totRetOrders = retData.reduce((s, r) => s + r.orders, 0);
  const totDelivered = retData.reduce((s, r) => s + r.delivered, 0);
  const dsr = totRetOrders > 0 ? totDelivered / totRetOrders : 0;

  const health = computeHealth({
    marginPct: 0.22,
    returnRate,
    confirmRate,
    roas,
    dsr,
    pendingShare,
  });

  // Daily orders last 7 days from orders createdAt
  const byDay = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key.slice(5), orders: 0, delivered: 0, returned: 0 };
    }
    orders.forEach(o => {
      const key = (o.createdAt || '').slice(0, 10);
      if (map[key]) {
        map[key].orders++;
        if (o.status === 'done') map[key].delivered++;
        if (o.status === 'returned') map[key].returned++;
      }
    });
    return Object.values(map);
  }, [orders]);

  const statusMix = [
    { name: 'New', value: orders.filter(o => o.status === 'new').length },
    { name: 'To confirm', value: orders.filter(o => o.status === 'to_confirm').length },
    { name: 'Confirmed', value: orders.filter(o => o.status === 'confirmed').length },
    { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'done').length },
    { name: 'Returned', value: orders.filter(o => o.status === 'returned').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ];

  const overdue = pending.filter(o => hoursSince(o.createdAt) > 24).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's orders" value={fmtNum(todayOrders)} icon="board" sub={`${fmtNum(orders.length)} total`} />
        <StatCard label="Pending confirmations" value={fmtNum(pending.length)} sub={`${fmtNum(overdue)} older than 24h`} tone={overdue ? 'rose' : 'slate'} icon="clock"/>
        <StatCard label="Confirmed / Shipped" value={fmtNum(confirmed.length)} sub={`Delivered: ${delivered.length}`} tone="emerald" icon="check"/>
        <StatCard label="Returned orders" value={fmtNum(returned.length)} sub={`Return rate ${fmtPct(returnRate)}`} tone={returnRate > 0.25 ? 'rose' : 'amber'} icon="refresh"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <Section title="Last 7 days" subtitle="Orders vs. delivered vs. returned">
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={byDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7"/>
                  <XAxis dataKey="date" fontSize={12} stroke="#94a3b8"/>
                  <YAxis fontSize={12} stroke="#94a3b8"/>
                  <Tooltip />
                  <Area type="monotone" dataKey="orders" stroke="#10b981" fill="url(#g1)" strokeWidth={2}/>
                  <Line type="monotone" dataKey="delivered" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                  <Line type="monotone" dataKey="returned" stroke="#ef4444" strokeWidth={2} dot={false}/>
                  <Legend/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <StatCard label="Revenue (delivered)" value={fmtDA(revenue)} tone="emerald"/>
            <StatCard label="Est. net profit" value={fmtDA(estProfit)} tone={estProfit < 0 ? 'rose' : 'emerald'}/>
            <StatCard label="ROAS (delivered)" value={roas.toFixed(2) + 'x'} tone={roas >= 2 ? 'emerald' : roas >= 1.4 ? 'amber' : 'rose'}/>
            <StatCard label="Delivery success" value={fmtPct(dsr)} tone={dsr >= 0.85 ? 'emerald' : dsr >= 0.7 ? 'amber' : 'rose'}/>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900">Weekly health score</div>
          <div className="flex justify-center my-2"><HealthGauge score={health.score} color={health.color}/></div>
          <Badge tone={health.color === 'emerald' ? 'emerald' : health.color === 'amber' ? 'amber' : 'rose'}>
            {health.status}
          </Badge>
          <p className="text-xs text-slate-500 mt-2">{health.diagnosis}</p>
          <div className="mt-3 space-y-2">
            {health.recommendations.slice(0, 3).map((r, i) => (
              <div key={i} className="flex gap-2 text-xs text-slate-700">
                <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <Section title="Pipeline" subtitle="Where orders are right now">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={statusMix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7"/>
                  <XAxis dataKey="name" fontSize={12} stroke="#94a3b8"/>
                  <YAxis fontSize={12} stroke="#94a3b8"/>
                  <Tooltip/>
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-900 mb-2">Rates</div>
          <div className="space-y-3">
            <RateBar label="Confirmation rate" value={confirmRate} good={0.75} warn={0.6}/>
            <RateBar label="Delivery success rate" value={dsr} good={0.85} warn={0.7}/>
            <RateBar label="Return rate" value={returnRate} invert good={0.15} warn={0.25}/>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RateBar({ label, value, good, warn, invert }) {
  const pct = Math.max(0, Math.min(1, value));
  let color = 'bg-emerald-500';
  if (invert) {
    if (value > warn) color = 'bg-rose-500';
    else if (value > good) color = 'bg-amber-500';
  } else {
    if (value < warn) color = 'bg-rose-500';
    else if (value < good) color = 'bg-amber-500';
  }
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">{(pct * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
        <div className={`${color} h-full`} style={{ width: (pct * 100).toFixed(1) + '%' }}/>
      </div>
    </div>
  );
}

// =================================================================
// PROFIT CALCULATOR
// =================================================================
function ProfitCalculatorPage() {
  const { Card, Section, TextInput, Badge, StatCard } = C();
  const { fmtDA, fmtPct, computeProfit } = U();

  const [form, setForm] = useState({
    price: 7500, cost: 2800, adSpend: 1200, deliveryCost: 600, packagingCost: 150,
    confirmationCost: 80, returnRate: 0.22, deliveryCompanyFee: 400, upsell: 0,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v === '' ? 0 : Number(v) }));
  const setPct = (k, v) => setForm(f => ({ ...f, [k]: (v === '' ? 0 : Number(v)) / 100 }));

  const r = useMemo(() => computeProfit(form), [form]);

  const fields = [
    { k: 'price', label: 'Selling price', suffix: 'DA' },
    { k: 'cost', label: 'Product cost', suffix: 'DA' },
    { k: 'adSpend', label: 'Ad spend per order', suffix: 'DA' },
    { k: 'deliveryCost', label: 'Delivery cost (your courier)', suffix: 'DA' },
    { k: 'packagingCost', label: 'Packaging cost', suffix: 'DA' },
    { k: 'confirmationCost', label: 'Confirmation cost', suffix: 'DA' },
    { k: 'deliveryCompanyFee', label: 'Delivery company fee', suffix: 'DA' },
    { k: 'upsell', label: 'Upsell revenue (optional)', suffix: 'DA' },
  ];

  return (
    <div className="space-y-6">
      {r.losingMoney && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm">
          <span className="font-bold">Warning:</span> at this return rate, you are losing money on every 100 confirmed orders. Reduce returns, increase price, or cut costs.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-1">
          <Section title="Inputs">
            <div className="grid grid-cols-1 gap-3">
              {fields.map(f => (
                <TextInput key={f.k} label={f.label} value={form[f.k]} onChange={(v) => set(f.k, v)} type="number" suffix={f.suffix}/>
              ))}
              <TextInput label="Return rate" value={Math.round(form.returnRate * 100)} onChange={(v) => setPct('returnRate', v)} type="number" suffix="%"/>
            </div>
          </Section>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Gross profit / order" value={fmtDA(r.grossPerOrder)} sub="Revenue − product cost"/>
          <StatCard label="Net / confirmed order" value={fmtDA(r.netPerConfirmedOrder)} tone={r.netPerConfirmedOrder >= 0 ? 'emerald' : 'rose'} sub="Before returns"/>
          <StatCard label="Expected net / order (after returns)" value={fmtDA(r.expectedNet)} tone={r.expectedNet >= 0 ? 'emerald' : 'rose'}/>
          <StatCard label="Profit margin" value={fmtPct(r.marginPct)} tone={r.marginPct >= 0.2 ? 'emerald' : r.marginPct >= 0.1 ? 'amber' : 'rose'}/>
          <StatCard label="Break-even return rate" value={r.breakEvenReturnRate != null ? fmtPct(r.breakEvenReturnRate) : '—'} sub="Above this, you lose money"/>
          <StatCard label="Loss per returned order" value={fmtDA(r.lossPerReturnedOrder)} tone="rose"/>
          <Card className="p-4 col-span-2 md:col-span-3">
            <div className="text-sm font-semibold text-slate-900 mb-2">Impact of reducing returns</div>
            <div className="grid grid-cols-3 gap-3">
              <Sensitivity label="−1%" value={r.sensitivity.drop1}/>
              <Sensitivity label="−5%" value={r.sensitivity.drop5}/>
              <Sensitivity label="−10%" value={r.sensitivity.drop10}/>
            </div>
            <div className="text-xs text-slate-500 mt-3">
              Extra profit <span className="font-semibold">per order</span> if you push the return rate down. Multiply by your monthly volume to see the real business impact.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
function Sensitivity({ label, value }) {
  const { fmtDA } = U();
  return (
    <div className="rounded-lg border border-slate-200 p-3 bg-emerald-50/40">
      <div className="text-xs text-slate-500">Return rate {label}</div>
      <div className={`text-lg font-bold ${value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>+{fmtDA(value)}</div>
    </div>
  );
}

// =================================================================
// RETURNS
// =================================================================
function ReturnsPage({ data, setData }) {
  const { Card, Section, TextInput, Select, Button, Badge, Modal, Icon } = C();
  const { fmtNum, fmtPct, wilayaById } = U();
  const { WILAYAS, PRODUCTS, DELIVERY_COMPANIES } = D();

  const [wFilter, setWFilter] = useState('all');
  const [pFilter, setPFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const rows = data.returns
    .filter(r => (wFilter === 'all' || r.wilaya === Number(wFilter)))
    .filter(r => (pFilter === 'all' || r.productId === pFilter))
    .filter(r => (!dateFrom || r.date >= dateFrom))
    .sort((a, b) => b.date.localeCompare(a.date));

  const perWilaya = useMemo(() => {
    const map = {};
    data.returns.forEach(r => {
      if (!map[r.wilaya]) map[r.wilaya] = { wilaya: r.wilaya, orders: 0, delivered: 0, returned: 0 };
      map[r.wilaya].orders += r.orders;
      map[r.wilaya].delivered += r.delivered;
      map[r.wilaya].returned += r.returned;
    });
    return Object.values(map).map(row => ({
      ...row,
      name: wilayaById(row.wilaya)?.name || row.wilaya,
      retRate: row.orders ? row.returned / row.orders : 0,
      dsr: row.orders ? row.delivered / row.orders : 0,
    })).sort((a, b) => b.retRate - a.retRate);
  }, [data.returns]);

  const save = (row) => {
    setData(d => {
      const id = row.id || ('R-' + Date.now());
      const next = d.returns.slice();
      const idx = next.findIndex(r => r.id === id);
      const entry = { ...row, id, wilaya: Number(row.wilaya), orders: Number(row.orders), delivered: Number(row.delivered), returned: Number(row.returned), pending: Number(row.pending || 0) };
      if (idx >= 0) next[idx] = entry; else next.unshift(entry);
      return { ...d, returns: next };
    });
    setOpen(false); setEditing(null);
  };
  const remove = (id) => setData(d => ({ ...d, returns: d.returns.filter(r => r.id !== id) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Wilaya" value={wFilter} onChange={setWFilter}
            options={[{ value: 'all', label: 'All wilayas' }, ...WILAYAS.map(w => ({ value: w.code, label: `${w.code} — ${w.name}` }))]}/>
          <Select label="Product" value={pFilter} onChange={setPFilter}
            options={[{ value: 'all', label: 'All products' }, ...PRODUCTS.map(p => ({ value: p.id, label: p.name }))]}/>
          <TextInput label="Date from" type="date" value={dateFrom} onChange={setDateFrom}/>
        </div>
        <Button onClick={() => { setEditing({ date: new Date().toISOString().slice(0, 10), wilaya: 16, productId: PRODUCTS[0].id, orders: 0, delivered: 0, returned: 0, pending: 0, company: 'Yalidine' }); setOpen(true); }}>
          <Icon name="plus" className="w-4 h-4"/> Add entry
        </Button>
      </div>

      <Card className="p-5">
        <Section title="Wilaya heatmap" subtitle="Red = high return rate. Click a row to inspect.">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {perWilaya.slice(0, 24).map(row => {
              const tone = row.retRate > 0.3 ? 'bg-rose-500/80 text-white' :
                           row.retRate > 0.2 ? 'bg-amber-400/80 text-slate-900' :
                           'bg-emerald-500/70 text-white';
              return (
                <div key={row.wilaya} className={`rounded-lg p-3 text-xs ${tone}`}>
                  <div className="font-bold">{row.name}</div>
                  <div className="opacity-90">{fmtNum(row.orders)} orders</div>
                  <div className="opacity-90">Ret {fmtPct(row.retRate)}</div>
                </div>
              );
            })}
          </div>
        </Section>
      </Card>

      <Card>
        <div className="p-5">
          <Section title="Daily entries" subtitle={`${fmtNum(rows.length)} rows`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Wilaya</th>
                    <th className="py-2 px-2">Product</th>
                    <th className="py-2 px-2 text-right">Orders</th>
                    <th className="py-2 px-2 text-right">Delivered</th>
                    <th className="py-2 px-2 text-right">Returned</th>
                    <th className="py-2 px-2 text-right">Pending</th>
                    <th className="py-2 px-2">Company</th>
                    <th className="py-2 px-2 text-right">Return rate</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const rate = r.orders ? r.returned / r.orders : 0;
                    const product = PRODUCTS.find(p => p.id === r.productId);
                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2 text-slate-700">{r.date}</td>
                        <td className="py-2 px-2">{wilayaById(r.wilaya)?.name || r.wilaya}</td>
                        <td className="py-2 px-2">{product?.name || r.productId}</td>
                        <td className="py-2 px-2 text-right">{fmtNum(r.orders)}</td>
                        <td className="py-2 px-2 text-right text-emerald-700">{fmtNum(r.delivered)}</td>
                        <td className="py-2 px-2 text-right text-rose-700">{fmtNum(r.returned)}</td>
                        <td className="py-2 px-2 text-right">{fmtNum(r.pending)}</td>
                        <td className="py-2 px-2">{r.company}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge tone={rate > 0.3 ? 'rose' : rate > 0.2 ? 'amber' : 'emerald'}>{fmtPct(rate)}</Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditing(r); setOpen(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Icon name="edit" className="w-4 h-4"/></button>
                            <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Icon name="trash" className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? 'Edit entry' : 'Add entry'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save(editing)}>Save</Button>
          </>
        }>
        {editing && (
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Date" type="date" value={editing.date} onChange={v => setEditing({ ...editing, date: v })}/>
            <Select label="Wilaya" value={editing.wilaya} onChange={v => setEditing({ ...editing, wilaya: Number(v) })}
              options={WILAYAS.map(w => ({ value: w.code, label: `${w.code} — ${w.name}` }))}/>
            <Select label="Product" value={editing.productId} onChange={v => setEditing({ ...editing, productId: v })}
              options={PRODUCTS.map(p => ({ value: p.id, label: p.name }))}/>
            <Select label="Delivery company" value={editing.company} onChange={v => setEditing({ ...editing, company: v })}
              options={DELIVERY_COMPANIES.map(c => ({ value: c, label: c }))}/>
            <TextInput label="Orders" type="number" value={editing.orders} onChange={v => setEditing({ ...editing, orders: v })}/>
            <TextInput label="Delivered" type="number" value={editing.delivered} onChange={v => setEditing({ ...editing, delivered: v })}/>
            <TextInput label="Returned" type="number" value={editing.returned} onChange={v => setEditing({ ...editing, returned: v })}/>
            <TextInput label="Pending" type="number" value={editing.pending} onChange={v => setEditing({ ...editing, pending: v })}/>
          </div>
        )}
      </Modal>
    </div>
  );
}

// =================================================================
// ADS
// =================================================================
function AdsPage({ data, setData }) {
  const { Card, Section, TextInput, Select, Button, Badge, Modal, Icon, StatCard } = C();
  const { fmtDA, fmtPct, fmtNum, recommendAd } = U();
  const { PRODUCTS } = D();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const rows = data.campaigns.map(c => {
    const rec = recommendAd(c, 1400); // ~1400 DA margin per delivered order, rough default
    return { ...c, ...rec };
  });

  const fbNet = rows.filter(r => r.platform === 'Facebook').reduce((s, r) => s + r.netProfit, 0);
  const ttNet = rows.filter(r => r.platform === 'TikTok').reduce((s, r) => s + r.netProfit, 0);
  const fbSpend = rows.filter(r => r.platform === 'Facebook').reduce((s, r) => s + r.spend, 0);
  const ttSpend = rows.filter(r => r.platform === 'TikTok').reduce((s, r) => s + r.spend, 0);
  const fbRev = rows.filter(r => r.platform === 'Facebook').reduce((s, r) => s + r.revenue, 0);
  const ttRev = rows.filter(r => r.platform === 'TikTok').reduce((s, r) => s + r.revenue, 0);

  const save = (c) => {
    setData(d => {
      const id = c.id || ('c-' + Date.now());
      const entry = {
        ...c, id,
        spend: Number(c.spend), impressions: Number(c.impressions), clicks: Number(c.clicks),
        leads: Number(c.leads), confirmed: Number(c.confirmed), delivered: Number(c.delivered),
        revenue: Number(c.revenue),
      };
      const next = d.campaigns.slice();
      const idx = next.findIndex(x => x.id === id);
      if (idx >= 0) next[idx] = entry; else next.unshift(entry);
      return { ...d, campaigns: next };
    });
    setOpen(false); setEditing(null);
  };
  const remove = (id) => setData(d => ({ ...d, campaigns: d.campaigns.filter(c => c.id !== id) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Facebook spend" value={fmtDA(fbSpend)} sub={`Revenue ${fmtDA(fbRev)}`}/>
        <StatCard label="Facebook net" value={fmtDA(fbNet)} tone={fbNet >= 0 ? 'emerald' : 'rose'} sub={`ROAS ${fbSpend ? (fbRev/fbSpend).toFixed(2) + 'x' : '—'}`}/>
        <StatCard label="TikTok spend" value={fmtDA(ttSpend)} sub={`Revenue ${fmtDA(ttRev)}`}/>
        <StatCard label="TikTok net" value={fmtDA(ttNet)} tone={ttNet >= 0 ? 'emerald' : 'rose'} sub={`ROAS ${ttSpend ? (ttRev/ttSpend).toFixed(2) + 'x' : '—'}`}/>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Section title="Campaigns" subtitle="Judged against delivered orders, not just leads"/>
          <Button onClick={() => { setEditing({ platform: 'Facebook', name: '', spend: 0, impressions: 0, clicks: 0, leads: 0, confirmed: 0, delivered: 0, revenue: 0, productId: PRODUCTS[0].id }); setOpen(true); }}>
            <Icon name="plus" className="w-4 h-4"/> Add campaign
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 px-2">Platform</th>
                <th className="py-2 px-2">Campaign</th>
                <th className="py-2 px-2 text-right">Spend</th>
                <th className="py-2 px-2 text-right">Leads</th>
                <th className="py-2 px-2 text-right">Conf.</th>
                <th className="py-2 px-2 text-right">Delivered</th>
                <th className="py-2 px-2 text-right">CPM</th>
                <th className="py-2 px-2 text-right">CPC</th>
                <th className="py-2 px-2 text-right">CTR</th>
                <th className="py-2 px-2 text-right">CPA</th>
                <th className="py-2 px-2 text-right">ROAS</th>
                <th className="py-2 px-2 text-right">Conf. rate</th>
                <th className="py-2 px-2 text-right">Delivery</th>
                <th className="py-2 px-2 text-right">Net</th>
                <th className="py-2 px-2">Action</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const cpm = c.impressions ? (c.spend / c.impressions) * 1000 : 0;
                const cpc = c.clicks ? c.spend / c.clicks : 0;
                const ctr = c.impressions ? c.clicks / c.impressions : 0;
                const cpa = c.confirmed ? c.spend / c.confirmed : 0;
                const actionTone = c.action === 'Scale' ? 'emerald' : c.action === 'Pause' ? 'rose' : 'amber';
                return (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-2 px-2">
                      <Badge tone={c.platform === 'Facebook' ? 'sky' : 'violet'}>{c.platform}</Badge>
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">{c.name}</td>
                    <td className="py-2 px-2 text-right">{fmtDA(c.spend)}</td>
                    <td className="py-2 px-2 text-right">{fmtNum(c.leads)}</td>
                    <td className="py-2 px-2 text-right">{fmtNum(c.confirmed)}</td>
                    <td className="py-2 px-2 text-right">{fmtNum(c.delivered)}</td>
                    <td className="py-2 px-2 text-right">{fmtDA(cpm)}</td>
                    <td className="py-2 px-2 text-right">{fmtDA(cpc)}</td>
                    <td className="py-2 px-2 text-right">{fmtPct(ctr, 2)}</td>
                    <td className="py-2 px-2 text-right">{fmtDA(cpa)}</td>
                    <td className="py-2 px-2 text-right font-semibold" style={{ color: c.roas >= 2 ? '#059669' : c.roas >= 1.4 ? '#d97706' : '#e11d48' }}>{c.roas.toFixed(2)}x</td>
                    <td className="py-2 px-2 text-right">{fmtPct(c.confirmRate)}</td>
                    <td className="py-2 px-2 text-right">{fmtPct(c.deliveryRate)}</td>
                    <td className="py-2 px-2 text-right font-semibold" style={{ color: c.netProfit >= 0 ? '#059669' : '#e11d48' }}>{fmtDA(c.netProfit)}</td>
                    <td className="py-2 px-2"><Badge tone={actionTone}>{c.action}</Badge></td>
                    <td className="py-2 px-2 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditing(c); setOpen(true); }} className="p-1.5 rounded hover:bg-slate-100 text-slate-600"><Icon name="edit" className="w-4 h-4"/></button>
                        <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600"><Icon name="trash" className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2">
          {rows.filter(r => r.action !== 'Test').map(r => (
            <div key={r.id} className="flex items-start gap-3 text-xs">
              <Badge tone={r.action === 'Scale' ? 'emerald' : r.action === 'Pause' ? 'rose' : 'amber'}>{r.action}</Badge>
              <div className="text-slate-700"><span className="font-semibold">{r.name}</span> — {r.reason}</div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? 'Edit campaign' : 'Add campaign'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save(editing)}>Save</Button></>}>
        {editing && (
          <div className="grid grid-cols-2 gap-3">
            <Select label="Platform" value={editing.platform} onChange={v => setEditing({ ...editing, platform: v })} options={[{ value: 'Facebook', label: 'Facebook' }, { value: 'TikTok', label: 'TikTok' }]}/>
            <Select label="Product" value={editing.productId} onChange={v => setEditing({ ...editing, productId: v })} options={PRODUCTS.map(p => ({ value: p.id, label: p.name }))}/>
            <TextInput label="Campaign name" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} className="col-span-2"/>
            <TextInput label="Spend (DA)" type="number" value={editing.spend} onChange={v => setEditing({ ...editing, spend: v })}/>
            <TextInput label="Impressions" type="number" value={editing.impressions} onChange={v => setEditing({ ...editing, impressions: v })}/>
            <TextInput label="Clicks" type="number" value={editing.clicks} onChange={v => setEditing({ ...editing, clicks: v })}/>
            <TextInput label="Leads / orders" type="number" value={editing.leads} onChange={v => setEditing({ ...editing, leads: v })}/>
            <TextInput label="Confirmed" type="number" value={editing.confirmed} onChange={v => setEditing({ ...editing, confirmed: v })}/>
            <TextInput label="Delivered" type="number" value={editing.delivered} onChange={v => setEditing({ ...editing, delivered: v })}/>
            <TextInput label="Revenue (delivered)" type="number" value={editing.revenue} onChange={v => setEditing({ ...editing, revenue: v })} className="col-span-2"/>
          </div>
        )}
      </Modal>
    </div>
  );
}

// =================================================================
// DELIVERY COMPARATOR
// =================================================================
function DeliveryPage() {
  const { Card, Section, Select, Badge } = C();
  const { fmtDA, fmtPct, trueCostPerConfirmed, wilayaById } = U();
  const { WILAYAS, DELIVERY_COMPANIES, DELIVERY_MATRIX } = D();

  const [wilaya, setWilaya] = useState('16');

  const rows = DELIVERY_MATRIX.filter(r => r.wilaya === Number(wilaya));
  const byCompany = DELIVERY_COMPANIES.map(c => {
    const all = DELIVERY_MATRIX.filter(x => x.company === c);
    const avgDsr = all.reduce((s, x) => s + x.dsr, 0) / all.length;
    const avgRet = all.reduce((s, x) => s + x.ret, 0) / all.length;
    const avgCost = all.reduce((s, x) => s + x.deliveryCost, 0) / all.length;
    const avgDays = all.reduce((s, x) => s + x.days, 0) / all.length;
    return { company: c, avgDsr, avgRet, avgCost, avgDays };
  });

  const bestPrice = rows.length ? rows.reduce((m, r) => r.deliveryCost < m.deliveryCost ? r : m) : null;
  const bestTrue = rows.length ? rows.reduce((m, r) => trueCostPerConfirmed(r) < trueCostPerConfirmed(m) ? r : m) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {byCompany.map(c => (
          <Card key={c.company} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-900">{c.company}</div>
              <Badge tone={c.avgDsr >= 0.85 ? 'emerald' : c.avgDsr >= 0.75 ? 'amber' : 'rose'}>
                DSR {fmtPct(c.avgDsr)}
              </Badge>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <div>Avg cost: <span className="font-semibold text-slate-800">{fmtDA(c.avgCost)}</span></div>
              <div>Avg return: <span className="font-semibold text-slate-800">{fmtPct(c.avgRet)}</span></div>
              <div>Avg days: <span className="font-semibold text-slate-800">{c.avgDays.toFixed(1)} d</span></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-end gap-3">
        <Select label="Wilaya" value={wilaya} onChange={setWilaya}
          options={WILAYAS.map(w => ({ value: w.code, label: `${w.code} — ${w.name}` }))}/>
      </div>

      <Card className="p-5">
        <Section title={`Comparison in ${wilayaById(Number(wilaya))?.name}`} subtitle="True cost per confirmed order factors in return costs weighted by return rate.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-2">Company</th>
                  <th className="py-2 px-2 text-right">Delivery cost</th>
                  <th className="py-2 px-2 text-right">Return cost</th>
                  <th className="py-2 px-2 text-right">Days</th>
                  <th className="py-2 px-2 text-right">Delivery success</th>
                  <th className="py-2 px-2 text-right">Return rate</th>
                  <th className="py-2 px-2 text-right">True cost / confirmed</th>
                  <th className="py-2 px-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const tc = trueCostPerConfirmed(r);
                  const risk = r.ret > 0.3 ? 'red' : r.ret > 0.2 ? 'yellow' : 'green';
                  return (
                    <tr key={r.company} className="border-b border-slate-100">
                      <td className="py-2 px-2 font-medium text-slate-900">
                        {r.company}
                        {bestTrue && bestTrue.company === r.company && <Badge tone="emerald" className="ml-2">Best true cost</Badge>}
                        {bestPrice && bestPrice.company === r.company && bestPrice.company !== bestTrue?.company && <Badge tone="amber" className="ml-2">Cheapest</Badge>}
                      </td>
                      <td className="py-2 px-2 text-right">{fmtDA(r.deliveryCost)}</td>
                      <td className="py-2 px-2 text-right">{fmtDA(r.returnCost)}</td>
                      <td className="py-2 px-2 text-right">{r.days} d</td>
                      <td className="py-2 px-2 text-right">{fmtPct(r.dsr)}</td>
                      <td className="py-2 px-2 text-right">{fmtPct(r.ret)}</td>
                      <td className="py-2 px-2 text-right font-semibold">{fmtDA(tc)}</td>
                      <td className="py-2 px-2">
                        <Badge tone={risk === 'green' ? 'emerald' : risk === 'yellow' ? 'amber' : 'rose'}>
                          {risk === 'green' ? 'Safe' : risk === 'yellow' ? 'Watch' : 'Risky'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {bestPrice && bestTrue && bestPrice.company !== bestTrue.company && (
            <div className="mt-4 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
              <span className="font-semibold">Heads up:</span> the cheapest option ({bestPrice.company}) is not the best once you factor in returns. {bestTrue.company} gives a lower true cost per confirmed order in this wilaya.
            </div>
          )}
        </Section>
      </Card>
    </div>
  );
}

// =================================================================
// ORDERS — Kanban
// =================================================================
const STAGES = [
  { id: 'new',        title: 'جديد',  en: 'New',       tone: 'sky' },
  { id: 'to_confirm', title: 'تأكيد', en: 'To confirm',tone: 'amber' },
  { id: 'confirmed',  title: 'مؤكد',  en: 'Confirmed', tone: 'emerald' },
  { id: 'shipped',    title: 'أُرسل', en: 'Shipped',   tone: 'violet' },
  { id: 'done',       title: 'تم',    en: 'Delivered', tone: 'emerald' },
  { id: 'returned',   title: 'مرجوع', en: 'Returned',  tone: 'rose' },
  { id: 'cancelled',  title: 'ملغي',  en: 'Cancelled', tone: 'slate' },
];

function OrdersPage({ data, setData }) {
  const { Card, Section, Button, Modal, TextInput, Select, Icon, Badge } = C();
  const { fmtDA, fmtDate, hoursSince, wilayaById } = U();
  const { WILAYAS, PRODUCTS, DELIVERY_COMPANIES } = D();

  const [search, setSearch] = useState('');
  const [wilayaF, setWilayaF] = useState('all');
  const [productF, setProductF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const filtered = data.orders.filter(o => {
    if (wilayaF !== 'all' && Number(wilayaF) !== o.wilaya) return false;
    if (productF !== 'all' && productF !== o.productId) return false;
    if (statusF !== 'all' && statusF !== o.status) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(o.client.toLowerCase().includes(s) || o.phone.includes(s) || o.id.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const move = (id, status) => setData(d => ({
    ...d,
    orders: d.orders.map(o => o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o),
  }));

  const save = (o) => {
    setData(d => {
      const entry = {
        ...o,
        id: o.id || ('ORD-' + Date.now()),
        wilaya: Number(o.wilaya),
        price: Number(o.price),
        attempts: Number(o.attempts || 0),
        createdAt: o.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        product: PRODUCTS.find(p => p.id === o.productId)?.name || o.product,
        callLog: o.callLog || [],
      };
      const next = d.orders.slice();
      const idx = next.findIndex(x => x.id === entry.id);
      if (idx >= 0) next[idx] = entry; else next.unshift(entry);
      return { ...d, orders: next };
    });
    setOpen(false); setEditing(null);
  };
  const remove = (id) => setData(d => ({ ...d, orders: d.orders.filter(o => o.id !== id) }));

  // HTML5 drag and drop
  const onDragStart = (e, id) => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e, status) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) move(id, status); };

  const openNew = () => {
    setEditing({
      client: '', phone: '', wilaya: 16, commune: '',
      productId: PRODUCTS[0].id, price: PRODUCTS[0].price, status: 'new',
      attempts: 0, notes: '', deliveryCompany: 'Yalidine', agent: 'Nadia',
    });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <TextInput label="Search" placeholder="Name, phone, ID…" value={search} onChange={setSearch}/>
          <Select label="Wilaya" value={wilayaF} onChange={setWilayaF}
            options={[{ value: 'all', label: 'All' }, ...WILAYAS.map(w => ({ value: w.code, label: w.name }))]}/>
          <Select label="Product" value={productF} onChange={setProductF}
            options={[{ value: 'all', label: 'All' }, ...PRODUCTS.map(p => ({ value: p.id, label: p.name }))]}/>
          <Select label="Status" value={statusF} onChange={setStatusF}
            options={[{ value: 'all', label: 'All' }, ...STAGES.map(s => ({ value: s.id, label: `${s.en}` }))]}/>
        </div>
        <Button onClick={openNew}><Icon name="plus" className="w-4 h-4"/> New order</Button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-3 min-w-max pb-2">
          {STAGES.map(stage => {
            const items = filtered.filter(o => o.status === stage.id);
            return (
              <div key={stage.id} className="kanban-col flex-1 max-w-xs"
                onDragOver={onDragOver} onDrop={(e) => onDrop(e, stage.id)}>
                <div className="bg-slate-100/70 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-slate-800 ar">
                      {stage.title} <span className="text-xs font-normal text-slate-500">{stage.en}</span>
                    </div>
                    <Badge tone={stage.tone}>{items.length}</Badge>
                  </div>
                  <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-thin">
                    {items.map(o => {
                      const old = hoursSince(o.createdAt) > 24 && ['new', 'to_confirm'].includes(o.status);
                      return (
                        <div key={o.id} draggable onDragStart={(e) => onDragStart(e, o.id)}
                          className={`bg-white rounded-lg p-3 border text-xs shadow-soft cursor-grab active:cursor-grabbing ${old ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-slate-900">{o.client}</div>
                            {old && <Badge tone="rose">24h+</Badge>}
                          </div>
                          <div className="text-slate-500 mt-0.5">{o.phone}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge tone="slate">{wilayaById(o.wilaya)?.name}</Badge>
                            <Badge tone="slate">{o.product}</Badge>
                            <Badge tone="emerald">{fmtDA(o.price)}</Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-slate-400">{fmtDate(o.createdAt)}</span>
                            <span className="text-slate-500">Attempts: {o.attempts}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            <button onClick={() => { setEditing(o); setOpen(true); }} className="flex-1 text-slate-600 hover:bg-slate-100 rounded py-1 text-[11px] flex items-center justify-center gap-1"><Icon name="edit" className="w-3 h-3"/>Edit</button>
                            <button onClick={() => remove(o.id)} className="flex-1 text-rose-600 hover:bg-rose-50 rounded py-1 text-[11px] flex items-center justify-center gap-1"><Icon name="trash" className="w-3 h-3"/>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                    {items.length === 0 && <div className="text-xs text-slate-400 text-center py-4">No orders</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing?.id ? `Edit ${editing.id}` : 'New order'}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => save(editing)}>Save</Button></>}>
        {editing && (
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Client name" value={editing.client} onChange={v => setEditing({ ...editing, client: v })}/>
            <TextInput label="Phone" value={editing.phone} onChange={v => setEditing({ ...editing, phone: v })}/>
            <Select label="Wilaya" value={editing.wilaya} onChange={v => setEditing({ ...editing, wilaya: Number(v) })}
              options={WILAYAS.map(w => ({ value: w.code, label: `${w.code} — ${w.name}` }))}/>
            <TextInput label="Commune" value={editing.commune} onChange={v => setEditing({ ...editing, commune: v })}/>
            <Select label="Product" value={editing.productId} onChange={v => {
              const prod = PRODUCTS.find(p => p.id === v); setEditing({ ...editing, productId: v, product: prod?.name, price: prod?.price || editing.price });
            }} options={PRODUCTS.map(p => ({ value: p.id, label: p.name }))}/>
            <TextInput label="Price" type="number" value={editing.price} onChange={v => setEditing({ ...editing, price: v })}/>
            <Select label="Status" value={editing.status} onChange={v => setEditing({ ...editing, status: v })}
              options={STAGES.map(s => ({ value: s.id, label: s.en }))}/>
            <Select label="Delivery company" value={editing.deliveryCompany} onChange={v => setEditing({ ...editing, deliveryCompany: v })}
              options={DELIVERY_COMPANIES.map(c => ({ value: c, label: c }))}/>
            <Select label="Agent" value={editing.agent} onChange={v => setEditing({ ...editing, agent: v })}
              options={['Nadia','Sami','Feriel','Hakim'].map(a => ({ value: a, label: a }))}/>
            <TextInput label="Call attempts" type="number" value={editing.attempts} onChange={v => setEditing({ ...editing, attempts: v })}/>
            <TextInput label="Notes" value={editing.notes} onChange={v => setEditing({ ...editing, notes: v })} className="col-span-2"/>
          </div>
        )}
      </Modal>
    </div>
  );
}

// =================================================================
// CALL SCRIPTS
// =================================================================
function CallScriptsPage() {
  const { Card, Section, TextInput, Select, Button, Textarea, CopyButton, Badge, Icon } = C();
  const { buildCallScript, buildWhatsAppMessage } = U();
  const { WILAYAS, PRODUCTS } = D();

  const [form, setForm] = useState({
    scenario: 'first', client: 'أمين', productId: PRODUCTS[0].id, price: PRODUCTS[0].price, wilaya: 16, days: 3,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const product = PRODUCTS.find(p => p.id === form.productId);
  const script = buildCallScript({
    scenario: form.scenario,
    client: form.client,
    product: product?.name,
    price: Number(form.price),
    wilaya: Number(form.wilaya),
    days: Number(form.days),
  });
  const waShort = buildWhatsAppMessage({
    template: form.scenario === 'first' ? 'first_confirm' : form.scenario === 'second' ? 'no_answer' : 'first_confirm',
    client: form.client, product: product?.name, price: Number(form.price), wilaya: Number(form.wilaya), days: Number(form.days),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5">
        <Section title="Scenario">
          <div className="space-y-3">
            <Select label="Scenario" value={form.scenario} onChange={v => set('scenario', v)} options={[
              { value: 'first', label: 'First call attempt' },
              { value: 'second', label: 'Second call attempt' },
              { value: 'angry', label: 'Angry client' },
              { value: 'wrong_number', label: 'Wrong number' },
              { value: 'expensive', label: 'Price is expensive' },
              { value: 'not_interested', label: 'Not interested' },
              { value: 'delay', label: 'Client asks to delay' },
              { value: 'upsell', label: 'Upsell attempt' },
            ]}/>
            <TextInput label="Client name" value={form.client} onChange={v => set('client', v)}/>
            <Select label="Product" value={form.productId} onChange={v => {
              const p = PRODUCTS.find(x => x.id === v);
              setForm(f => ({ ...f, productId: v, price: p?.price || f.price }));
            }} options={PRODUCTS.map(p => ({ value: p.id, label: p.name }))}/>
            <TextInput label="Price" type="number" value={form.price} onChange={v => set('price', v)}/>
            <Select label="Wilaya" value={form.wilaya} onChange={v => set('wilaya', Number(v))}
              options={WILAYAS.map(w => ({ value: w.code, label: `${w.code} — ${w.name}` }))}/>
            <TextInput label="Delivery days" type="number" value={form.days} onChange={v => set('days', v)}/>
          </div>
        </Section>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">Call script — Algerian Darija</div>
            <div className="text-xs text-slate-500">Read naturally. Confirm identity, product, address, price, and timing.</div>
          </div>
          <div className="flex gap-2">
            <CopyButton text={script} label="Copy script"/>
            <CopyButton text={waShort} label="Copy WhatsApp"/>
          </div>
        </div>
        <pre className="ar bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm whitespace-pre-wrap leading-7" dir="rtl">{script}</pre>

        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-900 mb-1">Short WhatsApp version</div>
          <pre className="ar bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm whitespace-pre-wrap leading-7" dir="rtl">{waShort}</pre>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge tone="emerald">Confirm identity</Badge>
          <Badge tone="emerald">Confirm product</Badge>
          <Badge tone="emerald">Confirm address</Badge>
          <Badge tone="emerald">Confirm price</Badge>
          <Badge tone="emerald">Set delivery timing</Badge>
          <Badge tone="violet">Commitment close</Badge>
          {form.scenario === 'upsell' && <Badge tone="amber">Upsell line</Badge>}
        </div>
      </Card>
    </div>
  );
}

// =================================================================
// FOLLOW-UPS
// =================================================================
function FollowUpsPage({ data, setData }) {
  const { Card, Section, Button, Badge, Icon } = C();
  const { fmtDate, hoursSince, wilayaById } = U();

  const [now] = useState(() => new Date());

  // Compute next scheduled call and overdue
  const enriched = data.orders
    .filter(o => ['new', 'to_confirm'].includes(o.status))
    .map(o => {
      const created = new Date(o.createdAt).getTime();
      const schedule = [created + 2 * 3600 * 1000, created + 22 * 3600 * 1000, created + 38 * 3600 * 1000];
      const attempts = o.attempts || 0;
      const nextAt = attempts >= 3 ? null : new Date(schedule[attempts]);
      const overdue = nextAt && nextAt < now && attempts < 3;
      const abandoned = attempts >= 3 && (o.status === 'new' || o.status === 'to_confirm');
      return { ...o, nextAt, overdue, abandoned };
    });

  const today = enriched.filter(o => !o.abandoned && o.nextAt && o.nextAt.toDateString() === now.toDateString());
  const overdue = enriched.filter(o => o.overdue && !o.abandoned);
  const upcoming = enriched.filter(o => !o.overdue && !o.abandoned && o.nextAt && o.nextAt > now).sort((a, b) => a.nextAt - b.nextAt).slice(0, 20);
  const abandoned = enriched.filter(o => o.abandoned);

  const markCalled = (id, outcome = 'no_answer') => {
    setData(d => ({
      ...d,
      orders: d.orders.map(o => {
        if (o.id !== id) return o;
        const attempts = (o.attempts || 0) + 1;
        const callLog = (o.callLog || []).slice();
        callLog.push({ at: new Date().toISOString(), outcome });
        let status = o.status;
        if (outcome === 'confirmed') status = 'confirmed';
        else if (outcome === 'cancelled') status = 'cancelled';
        else if (attempts >= 3) status = 'cancelled';
        return { ...o, attempts, callLog, status, updatedAt: new Date().toISOString() };
      }),
    }));
  };

  const Item = ({ o, accent }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${accent}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 text-sm">{o.client}</span>
          <Badge tone="slate">{o.phone}</Badge>
          <Badge tone="slate">{wilayaById(o.wilaya)?.name}</Badge>
          <Badge tone="emerald">{o.product}</Badge>
          <Badge tone={o.attempts >= 2 ? 'rose' : 'amber'}>Attempt {o.attempts + 1}</Badge>
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Created {fmtDate(o.createdAt)} • {hoursSince(o.createdAt).toFixed(0)}h ago
          {o.nextAt && <> • Next call {fmtDate(o.nextAt.toISOString())}</>}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="primary" onClick={() => markCalled(o.id, 'confirmed')}>Confirm</Button>
        <Button size="sm" variant="secondary" onClick={() => markCalled(o.id, 'no_answer')}>No answer</Button>
        <Button size="sm" variant="secondary" onClick={() => markCalled(o.id, 'needs_followup')}>Follow-up</Button>
        <Button size="sm" variant="danger" onClick={() => markCalled(o.id, 'cancelled')}>Cancel</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-slate-500">Overdue calls</div><div className="text-2xl font-bold text-rose-600">{overdue.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Today</div><div className="text-2xl font-bold text-amber-600">{today.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Upcoming (next)</div><div className="text-2xl font-bold text-slate-900">{upcoming.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Abandoned (3 failed)</div><div className="text-2xl font-bold text-slate-700">{abandoned.length}</div></Card>
      </div>

      <Card className="p-5">
        <Section title="Overdue — call now" subtitle="Every hour lost reduces confirmation rate.">
          {overdue.length === 0 && <div className="text-xs text-slate-500">Nothing overdue. Great.</div>}
          <div className="space-y-2">{overdue.slice(0, 15).map(o => <Item key={o.id} o={o} accent="border-rose-200 bg-rose-50/40"/>)}</div>
        </Section>
      </Card>

      <Card className="p-5">
        <Section title="Today's call list">
          {today.length === 0 && <div className="text-xs text-slate-500">No calls scheduled for today.</div>}
          <div className="space-y-2">{today.slice(0, 15).map(o => <Item key={o.id} o={o} accent="border-amber-200 bg-amber-50/40"/>)}</div>
        </Section>
      </Card>

      <Card className="p-5">
        <Section title="Upcoming">
          {upcoming.length === 0 && <div className="text-xs text-slate-500">Nothing scheduled yet.</div>}
          <div className="space-y-2">{upcoming.slice(0, 15).map(o => <Item key={o.id} o={o} accent="border-slate-200 bg-white"/>)}</div>
        </Section>
      </Card>
    </div>
  );
}

// =================================================================
// WHATSAPP
// =================================================================
const WA_TEMPLATES = [
  { id: 'first_confirm',    label: 'First confirmation' },
  { id: 'no_answer',        label: 'No answer follow-up' },
  { id: 'final_warning',    label: 'Final warning before cancellation' },
  { id: 'delivery_reminder',label: 'Delivery reminder' },
  { id: 'upsell',           label: 'Upsell message' },
  { id: 'delay_apology',    label: 'Delay apology' },
  { id: 'confirmed',        label: 'Order confirmed' },
];

function WhatsAppPage() {
  const { Card, Section, TextInput, Select, CopyButton } = C();
  const { buildWhatsAppMessage } = U();
  const { WILAYAS, PRODUCTS } = D();

  const [form, setForm] = useState({
    client: 'سارة', productId: PRODUCTS[0].id, price: PRODUCTS[0].price, wilaya: 16, days: 3,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const product = PRODUCTS.find(p => p.id === form.productId);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <Section title="Customer details" subtitle="Used in all templates.">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <TextInput label="Client name" value={form.client} onChange={v => set('client', v)}/>
            <Select label="Product" value={form.productId} onChange={v => {
              const p = PRODUCTS.find(x => x.id === v);
              setForm(f => ({ ...f, productId: v, price: p?.price || f.price }));
            }} options={PRODUCTS.map(p => ({ value: p.id, label: p.name }))}/>
            <TextInput label="Price" type="number" value={form.price} onChange={v => set('price', v)}/>
            <Select label="Wilaya" value={form.wilaya} onChange={v => set('wilaya', Number(v))}
              options={WILAYAS.map(w => ({ value: w.code, label: w.name }))}/>
            <TextInput label="Delivery days" type="number" value={form.days} onChange={v => set('days', v)}/>
          </div>
        </Section>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WA_TEMPLATES.map(t => {
          const msg = buildWhatsAppMessage({
            template: t.id, client: form.client, product: product?.name,
            price: Number(form.price), wilaya: Number(form.wilaya), days: Number(form.days),
          });
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900 text-sm">{t.label}</div>
                <CopyButton text={msg}/>
              </div>
              <pre className="ar mt-2 bg-slate-50 rounded-lg p-3 text-sm whitespace-pre-wrap leading-6" dir="rtl">{msg}</pre>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =================================================================
// AGENTS
// =================================================================
function AgentsPage({ data }) {
  const { Card, Section, Badge, StatCard } = C();
  const { fmtNum, fmtPct } = U();

  const rows = data.agents.map(a => ({
    ...a,
    confRate: a.calls ? a.confirmed / a.calls : 0,
    upsellRate: a.confirmed ? a.upsell / a.confirmed : 0,
    cancelRate: a.calls ? a.cancelled / a.calls : 0,
  })).sort((a, b) => b.confRate - a.confRate);

  const top = rows[0];
  const worst = rows[rows.length - 1];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="text-xs text-emerald-700 font-semibold">Top performer</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{top?.name}</div>
          <div className="text-xs text-slate-600 mt-1">Confirmation rate {fmtPct(top?.confRate)} · Avg attempts {top?.avgAttempts}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Team size</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{rows.length} agents</div>
          <div className="text-xs text-slate-500 mt-1">{fmtNum(rows.reduce((s, r) => s + r.calls, 0))} calls total</div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-rose-50 to-white border-rose-200">
          <div className="text-xs text-rose-700 font-semibold">Needs coaching</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{worst?.name}</div>
          <div className="text-xs text-slate-600 mt-1">Only {fmtPct(worst?.confRate)} confirm rate · {fmtPct(worst?.cancelRate)} cancelled</div>
        </Card>
      </div>

      <Card className="p-5">
        <Section title="Leaderboard">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Agent</th>
                  <th className="py-2 px-2 text-right">Calls</th>
                  <th className="py-2 px-2 text-right">Confirmed</th>
                  <th className="py-2 px-2 text-right">Confirmation rate</th>
                  <th className="py-2 px-2 text-right">Avg attempts</th>
                  <th className="py-2 px-2 text-right">Upsell rate</th>
                  <th className="py-2 px-2 text-right">Cancel rate</th>
                  <th className="py-2 px-2">Insight</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => {
                  let insight = 'Steady performer.';
                  let tone = 'slate';
                  if (a.confRate >= 0.7) { insight = 'Great closer — consider mentoring.'; tone = 'emerald'; }
                  else if (a.confRate < 0.5) { insight = 'Coach on objection handling and speed to call.'; tone = 'rose'; }
                  else if (a.upsellRate > 0.15) { insight = 'Strong at upsells.'; tone = 'violet'; }
                  return (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-2 px-2 font-semibold text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2 font-semibold text-slate-900">{a.name}</td>
                      <td className="py-2 px-2 text-right">{fmtNum(a.calls)}</td>
                      <td className="py-2 px-2 text-right">{fmtNum(a.confirmed)}</td>
                      <td className="py-2 px-2 text-right">
                        <Badge tone={a.confRate >= 0.7 ? 'emerald' : a.confRate >= 0.55 ? 'amber' : 'rose'}>{fmtPct(a.confRate)}</Badge>
                      </td>
                      <td className="py-2 px-2 text-right">{a.avgAttempts}</td>
                      <td className="py-2 px-2 text-right">{fmtPct(a.upsellRate)}</td>
                      <td className="py-2 px-2 text-right">{fmtPct(a.cancelRate)}</td>
                      <td className="py-2 px-2"><Badge tone={tone}>{insight}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </Card>
    </div>
  );
}

// =================================================================
// WILAYA RISK
// =================================================================
function WilayaRiskPage() {
  const { Card, Section, Badge, RiskDot, TextInput } = C();
  const { fmtPct, computeWilayaRisk } = U();
  const { WILAYAS } = D();

  const [q, setQ] = useState('');
  const rows = WILAYAS.map(w => {
    const r = computeWilayaRisk(w.code);
    return { ...w, ...r };
  }).sort((a, b) => a.score - b.score);

  const filtered = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || String(r.code) === q);

  const countBy = { green: 0, yellow: 0, red: 0 };
  rows.forEach(r => countBy[r.level]++);

  const actionFor = (r) => {
    if (r.level === 'green') return 'Confirm and ship normally.';
    if (r.level === 'yellow') return 'Double-confirm before shipping. Avoid COD for high-ticket items.';
    return 'Require extra confirmation or partial prepayment. Consider pausing this wilaya for risky products.';
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 border-l-4 border-emerald-500"><div className="text-xs text-slate-500">Low risk</div><div className="text-2xl font-bold text-emerald-700">{countBy.green}</div></Card>
        <Card className="p-4 border-l-4 border-amber-500"><div className="text-xs text-slate-500">Medium risk</div><div className="text-2xl font-bold text-amber-700">{countBy.yellow}</div></Card>
        <Card className="p-4 border-l-4 border-rose-500"><div className="text-xs text-slate-500">High risk</div><div className="text-2xl font-bold text-rose-700">{countBy.red}</div></Card>
      </div>

      <Card className="p-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <Section title="All wilayas" subtitle="Sorted lowest to highest safety score."/>
          <TextInput label="Search" value={q} onChange={setQ} placeholder="Name or code…"/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 px-2">Risk</th>
                <th className="py-2 px-2">Code</th>
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2 text-right">Safety score</th>
                <th className="py-2 px-2 text-right">Conf. rate</th>
                <th className="py-2 px-2 text-right">Return rate</th>
                <th className="py-2 px-2 text-right">Delivery success</th>
                <th className="py-2 px-2 text-right">Days</th>
                <th className="py-2 px-2">Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.code} className="border-b border-slate-100">
                  <td className="py-2 px-2"><div className="flex items-center gap-2"><RiskDot level={r.level}/><span className="capitalize text-xs text-slate-600">{r.level}</span></div></td>
                  <td className="py-2 px-2 text-slate-500">{r.code}</td>
                  <td className="py-2 px-2 font-medium text-slate-900">{r.name} <span className="ar text-slate-400 text-xs ml-1">{r.ar}</span></td>
                  <td className="py-2 px-2 text-right">
                    <Badge tone={r.level === 'green' ? 'emerald' : r.level === 'yellow' ? 'amber' : 'rose'}>{r.score}</Badge>
                  </td>
                  <td className="py-2 px-2 text-right">{fmtPct(r.conf)}</td>
                  <td className="py-2 px-2 text-right">{fmtPct(r.ret)}</td>
                  <td className="py-2 px-2 text-right">{fmtPct(r.dsr)}</td>
                  <td className="py-2 px-2 text-right">{r.days} d</td>
                  <td className="py-2 px-2 text-xs text-slate-600">{actionFor(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// =================================================================
// SETTINGS
// =================================================================
function SettingsPage({ data, setData, resetAll }) {
  const { Card, Section, Button, Badge } = C();
  const { fmtNum } = U();

  const counts = {
    orders: data.orders.length,
    returns: data.returns.length,
    campaigns: data.campaigns.length,
    agents: data.agents.length,
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'aecc-export-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); URL.revokeObjectURL(url);
  };

  const onImport = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setData(parsed);
      } catch (e) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-5">
        <Section title="Data" subtitle="Everything lives in your browser (localStorage). Nothing is sent to a server.">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Orders</div>
              <div className="text-xl font-bold">{fmtNum(counts.orders)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Returns entries</div>
              <div className="text-xl font-bold">{fmtNum(counts.returns)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Ad campaigns</div>
              <div className="text-xl font-bold">{fmtNum(counts.campaigns)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">Agents</div>
              <div className="text-xl font-bold">{fmtNum(counts.agents)}</div>
            </div>
          </div>
        </Section>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" onClick={exportJSON}>Export JSON</Button>
          <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm px-3.5 py-2">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={onImport}/>
          </label>
          <Button variant="danger" onClick={() => { if (confirm('Reset all data to sample?')) resetAll(); }}>Reset to sample</Button>
        </div>
      </Card>

      <Card className="p-5">
        <Section title="About" subtitle="MVP — frontend-only, LocalStorage-backed.">
          <div className="text-sm text-slate-700 space-y-2">
            <p>Algerian Ecom Command Center + Confirm Pro helps COD sellers in Algeria track profitability, reduce returns, improve confirmation rates, compare couriers, and manage daily operations.</p>
            <p className="text-xs text-slate-500">Flow: Ad spend → order → confirmation → delivery → return/profit → weekly health score.</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="emerald">React</Badge>
            <Badge tone="sky">Tailwind</Badge>
            <Badge tone="violet">Recharts</Badge>
            <Badge tone="slate">LocalStorage</Badge>
          </div>
        </Section>
      </Card>
    </div>
  );
}

window.AppPages = {
  OverviewPage, ProfitCalculatorPage, ReturnsPage, AdsPage, DeliveryPage,
  OrdersPage, CallScriptsPage, FollowUpsPage, WhatsAppPage, AgentsPage,
  WilayaRiskPage, SettingsPage,
};

})();
