import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ARCalibration } from './components/ARCalibration';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ARCalibration />
    </StrictMode>
);
