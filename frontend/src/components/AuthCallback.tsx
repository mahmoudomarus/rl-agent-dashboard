import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase/client'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 AuthCallback: Starting auth processing')
        console.log('🔍 Current URL:', window.location.href)
        console.log('🔍 URL Hash:', window.location.hash)
        
        setStatus('Extracting authentication tokens...')
        
        // The key issue: Supabase needs time to process the URL hash
        // We need to force it to check for the session from the URL
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        console.log('🔍 Initial session check:', { sessionData, sessionError })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setStatus(`Authentication failed: ${sessionError.message}`)
          setTimeout(() => navigate('/auth?error=' + encodeURIComponent(sessionError.message)), 3000)
          return
        }

        if (sessionData.session?.user) {
          console.log('✅ Session found immediately:', sessionData.session.user.email)
          setStatus('Authentication successful! Redirecting...')
          localStorage.setItem('auth_token', sessionData.session.access_token)
          setTimeout(() => navigate('/', { replace: true }), 1500)
          return
        }

        // If no session yet, manually check for tokens in URL hash
        console.log('🔍 No immediate session, checking URL fragments...')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        console.log('🔍 URL Tokens:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          accessTokenPreview: accessToken?.substring(0, 20) + '...'
        })

        if (accessToken && refreshToken) {
          setStatus('Setting up session with tokens...')
          
          // Use setSession to manually set the session from URL tokens
          const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          console.log('🔍 SetSession result:', { setSessionData, setSessionError })
          
          if (setSessionError) {
            console.error('❌ SetSession error:', setSessionError)
            setStatus(`Session setup failed: ${setSessionError.message}`)
            setTimeout(() => navigate('/auth?error=' + encodeURIComponent(setSessionError.message)), 3000)
            return
          }

          if (setSessionData.session?.user) {
            console.log('✅ Session set successfully:', setSessionData.session.user.email)
            setStatus('Authentication successful! Redirecting...')
            localStorage.setItem('auth_token', setSessionData.session.access_token)
            
            // Clean the URL by navigating without hash
            setTimeout(() => navigate('/', { replace: true }), 1500)
            return
          }
        }

        // If we reach here, something went wrong
        console.log('❌ No valid session or tokens found')
        setStatus('Authentication failed - no valid session')
        setTimeout(() => navigate('/auth?error=' + encodeURIComponent('No valid authentication found')), 3000)
        
      } catch (error) {
        console.error('❌ Auth callback error:', error)
        setStatus(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTimeout(() => navigate('/auth?error=' + encodeURIComponent('Authentication processing failed')), 3000)
      }
    }

    // Start processing immediately but allow DOM to settle
    const timer = setTimeout(handleAuthCallback, 200)
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
