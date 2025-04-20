import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { supabase } from '../supabaseClient'; // Ensure this import is at the top

export default function Login() {
  const { t, language, toggleLanguage, rtl } = useTranslation();
  const navigate = useNavigate();
  
  const [storeId, setStoreId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    // تحقق من جدول admins يدويًا
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('store_id', storeId)
      .eq('password', password)
      .single();
  
    if (error || !data) {
      alert('Invalid credentials. Please try again.');
    } else {
      localStorage.setItem('store_id', storeId); // تخزين session
      navigate('/dashboard');
    }
  
    setLoading(false);
  };  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4 relative"
         style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
         dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Language selector */}
      <div className={`absolute top-4 ${rtl ? 'left-4' : 'right-4'} z-10`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newLang = language === 'en' ? 'ar' : 'en';
            toggleLanguage(newLang);
          }}
          className={`flex items-center gap-2 ${rtl ? 'flex-row-reverse' : ''}`}
        >
          {language === 'en' ? '🇸🇦 العربية' : '🇺🇸 English'}
        </Button>
      </div>
      
      <div className="glass-card w-full max-w-md p-8 rounded-xl">
        <div className={`space-y-6 ${rtl ? 'text-right' : 'text-left'}`}>
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text">
              {t('Store Login')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('Log in to access your dashboard')}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Store ID / Email Field */}
            <div className="space-y-1">
              <Label htmlFor="storeId" className={`block ${rtl ? 'text-right' : ''}`}>
                {t('Store ID')}
              </Label>
              <Input 
                id="storeId" 
                placeholder={t('Enter store ID')}
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className={`bg-background/50 ${rtl ? 'text-right' : ''}`}
                required
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-1">
              <Label htmlFor="password" className={`block ${rtl ? 'text-right' : ''}`}>
                {isFirstLogin ? t('New Password') : t('Password')}
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder={t('Enter password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-background/50 ${rtl ? 'pr-4 pl-10 text-right' : 'pr-10'}`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${rtl ? 'left-0' : 'right-0'} top-0 h-full px-3 py-2`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              
              {isFirstLogin && (
                <div className={`text-xs text-muted-foreground mt-1 ${rtl ? 'text-right' : ''}`}>
                  {t('Please set a new password for your account')}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-neon-blue hover:bg-neon-blue/90" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full animate-spin"></div>
                  {t('Logging in...')}
                </div>
              ) : (
                isFirstLogin ? t('Set New Password') : t('Login')
              )}
            </Button>
            
            {/* Demo Help Text */}
            <div className={`text-xs text-center text-muted-foreground border-t border-border pt-4 mt-4 ${rtl ? 'text-right' : ''}`}>
              <p>
                {t('For demo: Use "new" as Store ID and "password" for first login.')}<br/>
                For real store account: Use "user" and "password".<br/>
                For admin access: Use "admin" and "password".
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
