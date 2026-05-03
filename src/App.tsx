import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Today } from '@/pages/Today';
import { Insights } from '@/pages/Insights';
import { Categories } from '@/pages/Categories';
import { CategoryDetail } from '@/pages/CategoryDetail';
import { MetricDetail } from '@/pages/MetricDetail';
import { Settings } from '@/pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:id" element={<CategoryDetail />} />
        <Route path="/metrics/:id" element={<MetricDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
