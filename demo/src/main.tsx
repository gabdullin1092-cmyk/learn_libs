import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { AuthProvider } from './store/AuthContext'

// QueryClient — синглтон, управляет кешем и состоянием всех useMutation/useQuery
const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ChakraProvider — подключает тему и CSS-переменные Chakra UI v3 */}
    <ChakraProvider value={defaultSystem}>
      {/* QueryClientProvider — делает queryClient доступным через хуки */}
      <QueryClientProvider client={queryClient}>
        {/* AuthProvider — аналог beforeLoad в TanStack Router Root */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ChakraProvider>
  </StrictMode>
)
