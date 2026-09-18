import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import Nav from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Nav/>
  </StrictMode>,
)
