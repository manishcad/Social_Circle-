'use client'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      const email = searchParams.get('email');
      const token = searchParams.get('token');

      if (!email) {
        setStatus('error');
        setMessage('Email parameter is required');
        return;
      }

      try {
        const response = await fetch(`/api/verify-email?email=${email}&token=${token}`);
        
        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully!');
          
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            router.push('/auth?verified=true');
          }, 2000);
        } else {
          const data = await response.json();
          setStatus('error');
          setMessage(data.error || 'Email verification failed click again on the link');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification try clicking again');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {status === 'verifying' && (
          <>
            <h1>Verifying Email...</h1>
            <p>Please wait while we verify your email address.</p>
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>✅ Email Verified!</h1>
            <p>{message}</p>
            <p>Redirecting to login page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>❌ Verification Failed</h1>
            <p>{message}</p>
            <button 
              onClick={() => router.push('/auth')}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </>
        )}

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}