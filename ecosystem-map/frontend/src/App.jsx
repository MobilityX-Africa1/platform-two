import { lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { useDataStore } from './store/dataStore';

// The dashboard is the landing page, so it ships in the main bundle. Every
// other page is its own chunk, which keeps page-specific dependencies (e.g.
// recharts, used only by Asset Economics) off the first load.
const pageLoaders = {
  CountriesPage: () => import('./pages/CountriesPage'),
  CountryPage: () => import('./pages/CountryPage'),
  CompareCountriesPage: () => import('./pages/CompareCountriesPage'),
  CompaniesPage: () => import('./pages/CompaniesPage'),
  CompanyPage: () => import('./pages/CompanyPage'),
  AllocatorsPage: () => import('./pages/AllocatorsPage'),
  AllocatorPage: () => import('./pages/AllocatorPage'),
  DealsPage: () => import('./pages/DealsPage'),
  VerticalPage: () => import('./pages/VerticalPage'),
  AssetEconomicsPage: () => import('./pages/AssetEconomicsPage'),
  AssetEconomicsMarketPage: () => import('./pages/AssetEconomicsMarketPage'),
};

// Pages are named exports; React.lazy needs a default one.
const lazyPage = (name) => lazy(() => pageLoaders[name]().then((m) => ({ default: m[name] })));

const CountriesPage = lazyPage('CountriesPage');
const CountryPage = lazyPage('CountryPage');
const CompareCountriesPage = lazyPage('CompareCountriesPage');
const CompaniesPage = lazyPage('CompaniesPage');
const CompanyPage = lazyPage('CompanyPage');
const AllocatorsPage = lazyPage('AllocatorsPage');
const AllocatorPage = lazyPage('AllocatorPage');
const DealsPage = lazyPage('DealsPage');
const VerticalPage = lazyPage('VerticalPage');
const AssetEconomicsPage = lazyPage('AssetEconomicsPage');
const AssetEconomicsMarketPage = lazyPage('AssetEconomicsMarketPage');

export default function App() {
  const dataReady = useDataStore((s) => s.status === 'ready');

  // Once the Notion data has landed (so the two never compete for bandwidth
  // on a slow connection), warm the remaining page chunks in the background
  // so later navigation never waits on the network.
  useEffect(() => {
    if (!dataReady) return undefined;
    const prefetch = () => Object.values(pageLoaders).forEach((load) => load());
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 1000);
    return () => window.clearTimeout(id);
  }, [dataReady]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/countries" element={<CountriesPage />} />
        <Route path="/compare" element={<CompareCountriesPage />} />
        <Route path="/country/:id" element={<CountryPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/allocators" element={<AllocatorsPage />} />
        <Route path="/allocator/:id" element={<AllocatorPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/vertical/:name" element={<VerticalPage />} />
        <Route path="/asset-economics" element={<AssetEconomicsPage />} />
        <Route path="/asset-economics/:id" element={<AssetEconomicsMarketPage />} />
      </Route>
    </Routes>
  );
}
