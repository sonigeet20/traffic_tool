import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { isDatabaseSetup, setupDatabaseSQL } from './lib/setup-database';
import Dashboard from './components/Dashboard';
import SetupScreen from './components/SetupScreen';
import Auth from './components/Auth';
import { Activity } from 'lucide-react';

function App() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await Promise.all([checkAuth(), checkSetup()]);
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.error('Connection timeout - proceeding with defaults');
        setIsAuthenticated((prev) => prev === null ? false : prev);
        setIsSetup((prev) => prev === null ? true : prev);
      }
    }, 10000); // 10 second timeout

    init();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  async function checkAuth() {
    try {
      console.log('[APP] Checking authentication...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[APP] Auth check error:', error);
        setIsAuthenticated(false);
        return;
      }
      console.log('[APP] Auth status:', !!session ? 'authenticated' : 'not authenticated');
      setIsAuthenticated(!!session);

      supabase.auth.onAuthStateChange((_event, session) => {
        console.log('[APP] Auth state changed:', _event, !!session);
        setIsAuthenticated(!!session);
      });
    } catch (err) {
      console.error('[APP] Auth check failed:', err);
      setIsAuthenticated(false);
    }
  }

  async function checkSetup() {
    try {
      console.log('[APP] Checking database setup...');
      const setup = await isDatabaseSetup();
      console.log('[APP] Database setup status:', setup);
      setIsSetup(setup);
    } catch (err) {
      console.error('[APP] Setup check failed:', err);
      setIsSetup(true); // Assume setup is complete on error
    }
  }

  async function handleSetup() {
    setIsSettingUp(true);
    setSetupError(null);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: setupDatabaseSQL });

      if (error) {
        setSetupError(error.message);
      } else {
        setIsSetup(true);
      }
    } catch (err) {
      setSetupError('Please run the SQL setup script in the Supabase SQL Editor. Copy it from the setup screen.');
    } finally {
      setIsSettingUp(false);
    }
  }

  if (isSetup === null || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Checking system...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  if (!isSetup) {
    return (
      <SetupScreen
        sql={setupDatabaseSQL}
        onSetup={handleSetup}
        isSettingUp={isSettingUp}
        error={setupError}
      />
    );
  }

  return <Dashboard />;
}

export default App;
