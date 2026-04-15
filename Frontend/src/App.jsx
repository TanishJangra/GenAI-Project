import { useState } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './app.routes.jsx'
import { AuthProvider } from './features/auth/auth.context.jsx'
import { InterviewProvider } from './features/interview/interview.context.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <InterviewProvider>
      <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App
