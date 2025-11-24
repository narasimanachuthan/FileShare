import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DownloadPage from './pages/DownloadPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/d/:fileId" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;