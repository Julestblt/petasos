import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import App from './app'
import { ChatPage } from '@/components/chat/chat-page'
import { SkillsPage } from '@/components/skills/skills-page'
import { StatusPage } from '@/components/status/status-page'
import { TooltipProvider } from '@/components/ui/tooltip'
import { initTheme } from '@/stores/themeStore'
import './index.css'

initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<ChatPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="skills" element={<SkillsPage />} />
          </Route>
          <Route path="/v2/*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
)
