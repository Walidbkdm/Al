/* global window, React, ReactDOM */
// App root. Wires sidebar, routing, localStorage state.

(function () {

const { useState } = React;

function App() {
  const { Sidebar, TopBar, NAV } = window.AppComponents;
  const { useLocalStorage } = window.AppUtils;
  const { SAMPLE_ORDERS, SAMPLE_AD_CAMPAIGNS, SAMPLE_AGENTS, SAMPLE_RETURNS } = window.AppData;
  const P = window.AppPages;

  const [route, setRoute] = useLocalStorage('route', 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // App state, persisted.
  const [orders, setOrders] = useLocalStorage('orders', SAMPLE_ORDERS);
  const [returns, setReturns] = useLocalStorage('returns', SAMPLE_RETURNS);
  const [campaigns, setCampaigns] = useLocalStorage('campaigns', SAMPLE_AD_CAMPAIGNS);
  const [agents, setAgents] = useLocalStorage('agents', SAMPLE_AGENTS);

  const data = { orders, returns, campaigns, agents };
  const setData = (updater) => {
    const next = typeof updater === 'function' ? updater(data) : updater;
    if (next.orders !== orders) setOrders(next.orders);
    if (next.returns !== returns) setReturns(next.returns);
    if (next.campaigns !== campaigns) setCampaigns(next.campaigns);
    if (next.agents !== agents) setAgents(next.agents);
  };

  const resetAll = () => {
    setOrders(SAMPLE_ORDERS);
    setReturns(SAMPLE_RETURNS);
    setCampaigns(SAMPLE_AD_CAMPAIGNS);
    setAgents(SAMPLE_AGENTS);
  };

  const meta = NAV.find(n => n.id === route) || NAV[0];

  const page = (() => {
    switch (route) {
      case 'overview':  return <P.OverviewPage data={data} setData={setData}/>;
      case 'profit':    return <P.ProfitCalculatorPage/>;
      case 'returns':   return <P.ReturnsPage data={data} setData={setData}/>;
      case 'ads':       return <P.AdsPage data={data} setData={setData}/>;
      case 'delivery':  return <P.DeliveryPage/>;
      case 'orders':    return <P.OrdersPage data={data} setData={setData}/>;
      case 'scripts':   return <P.CallScriptsPage/>;
      case 'followups': return <P.FollowUpsPage data={data} setData={setData}/>;
      case 'whatsapp':  return <P.WhatsAppPage/>;
      case 'agents':    return <P.AgentsPage data={data}/>;
      case 'risk':      return <P.WilayaRiskPage/>;
      case 'settings':  return <P.SettingsPage data={data} setData={setData} resetAll={resetAll}/>;
      default:          return <P.OverviewPage data={data} setData={setData}/>;
    }
  })();

  const subtitles = {
    overview:  'Today’s pulse of your e-commerce business',
    profit:    'Understand the true profit per order after returns',
    returns:   'Track deliveries, returns and pending per wilaya',
    ads:       'Compare Facebook and TikTok campaigns honestly',
    delivery:  'Compare Yalidine, Procolis, Maystro and Ecotrack',
    orders:    'Kanban board for your confirmation pipeline',
    scripts:   'Darija-ready call scripts for every scenario',
    followups: 'Never lose an order to silence',
    whatsapp:  'Ready-to-send templates in Darija',
    agents:    'Performance leaderboard for your team',
    risk:      'Know which wilayas hurt your margins',
    settings:  'Export, import, reset',
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar current={route} onChange={setRoute} open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar
          title={meta.label}
          subtitle={subtitles[route]}
          onMenu={() => setSidebarOpen(true)}
        />
        <div className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          {page}
        </div>
        <footer className="text-center text-[11px] text-slate-400 py-4">
          Algerian Ecom Command Center + Confirm Pro — MVP
        </footer>
      </main>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);

})();
