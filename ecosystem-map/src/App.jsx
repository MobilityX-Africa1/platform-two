import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CountriesPage } from './pages/CountriesPage';
import { CountryPage } from './pages/CountryPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyPage } from './pages/CompanyPage';
import { AllocatorsPage } from './pages/AllocatorsPage';
import { AllocatorPage } from './pages/AllocatorPage';
import { VerticalPage } from './pages/VerticalPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/countries" element={<CountriesPage />} />
        <Route path="/country/:id" element={<CountryPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/company/:id" element={<CompanyPage />} />
        <Route path="/allocators" element={<AllocatorsPage />} />
        <Route path="/allocator/:id" element={<AllocatorPage />} />
        <Route path="/vertical/:name" element={<VerticalPage />} />
      </Route>
    </Routes>
  );
}
