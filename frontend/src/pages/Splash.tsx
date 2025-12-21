import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [fadeOut, setFadeOut] = useState(false);
  const [motionError, setMotionError] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Wait 1-2 seconds then redirect (optimized for better UX)
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          if (user) {
            // Check if onboarding is completed - prefer backend value, fallback to localStorage
            const onboardingCompleted = user.onboardingCompleted ?? (localStorage.getItem('onboardingCompleted') === 'true');
            if (!onboardingCompleted) {
              navigate('/onboarding');
            } else {
              navigate('/');
            }
          } else {
            navigate('/login');
          }
        }, 400);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [loading, user, navigate]);

  // Fallback if motion fails
  if (motionError) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          background: '#050506',
          color: '#f4f4f5',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#780606' }}>UATI</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#780606' }}>NEXUS</div>
        <div style={{ width: '128px', height: '4px', background: '#780606', borderRadius: '2px' }} />
      </div>
    );
  }

  try {
    return (
      <motion.div
        className="flex h-screen items-center justify-center bg-background"
        style={{ background: '#050506' }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-lg border-2 border-primary/30"
          />
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative flex h-20 w-20 items-center justify-center rounded-lg bg-primary shadow-[0_0_30px_rgba(120,6,6,0.5)]"
          >
            <Network className="h-12 w-12 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-white tracking-wider"
          >
            UATI
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-3xl font-bold text-primary tracking-wider mt-1"
          >
            NEXUS
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 128 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-4"
        >
          <div className="h-1 w-32 rounded-full bg-primary/30 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
    );
  } catch (error) {
    console.error('Error rendering Splash:', error);
    setMotionError(true);
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          background: '#050506',
          color: '#f4f4f5',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#780606' }}>UATI</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#780606' }}>NEXUS</div>
        <div style={{ width: '128px', height: '4px', background: '#780606', borderRadius: '2px' }} />
      </div>
    );
  }
}

