import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase/client'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('Checking authentication state...')
        
        // Supabase automatically handles OAuth callbacks when getSession is called
        // The URL fragments will be processed internally
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('Authentication failed')
          setTimeout(() => navigate('/auth?error=' + encodeURIComponent(error.message)), 2000)
          return
        }

        if (data.session?.user) {
          console.log('✅ Authentication successful:', data.session.user.email)
          setStatus('Authentication successful! Redirecting...')
          
          // Store the session and redirect
          localStorage.setItem('auth_token', data.session.access_token)
          
          // Give a moment for the auth state to propagate
          setTimeout(() => {
            navigate('/', { replace: true })
          }, 1500)
        } else {
          console.log('❌ No session found')
          setStatus('No authentication session found')
          setTimeout(() => navigate('/auth'), 2000)
        }
      } catch (error) {
        console.error('❌ Auth callback error:', error)
        setStatus('Authentication error occurred')
        setTimeout(() => navigate('/auth?error=' + encodeURIComponent('Authentication failed')), 2000)
      }
    }

    // Small delay to ensure URL is fully loaded
    const timer = setTimeout(handleAuthCallback, 100)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Krib AI Authentication
        </h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
