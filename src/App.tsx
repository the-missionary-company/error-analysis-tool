import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AnnotatePage } from './pages/AnnotatePage';
import { TaxonomyPage } from './pages/TaxonomyPage';
import { SteersPage } from './pages/SteersPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SteersPage />} />
        <Route path="datasets" element={<HomePage />} />
        <Route path="annotate/:datasetId" element={<AnnotatePage />} />
        <Route path="taxonomy/:datasetId" element={<TaxonomyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
