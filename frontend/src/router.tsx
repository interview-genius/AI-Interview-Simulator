import { Routes, Route, Navigate } from 'react-router-dom';
import { CodingRoundPage } from './components/coding/CodingRoundPage';
import { MLRoundPage } from './components/ml/MLRoundPage';

// /config, /technical, /hr are Person A's (Config flow UI, Technical
// Discussion mode, HR Round mode) -- reserved path names, not built here.
export function AppRouter() {
  return (
    <Routes>
      <Route path="/coding" element={<CodingRoundPage />} />
      <Route path="/ml" element={<MLRoundPage />} />
      <Route path="*" element={<Navigate to="/coding" replace />} />
    </Routes>
  );
}
