import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { decrypt } from '@/lib/crypto';
import { TOTP } from 'totp-generator';

interface TwoFactorValidationProps {
  isOpen: boolean;
  secret: string; // Encrypted secret
  onClose: () => void;
  onValidate: (isValid: boolean) => void;
}

export default function TwoFactorValidation({
  isOpen,
  secret,
  onClose,
  onValidate,
}: TwoFactorValidationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
  
    try {
      const response = await fetch('http://localhost:8000/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          code
        })
      });
  
      const result = await response.json();
  
      if (result.valid) {
        toast.success('2FA code is valid');
        onValidate(true);
      } else {
        toast.error('Invalid 2FA code');
        onValidate(false);
      }
    } catch (err) {
      console.error('Validation error:', err);
      toast.error('Error validating code');
      onValidate(false);
    } finally {
      setLoading(false);
      setCode('');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify 2FA Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
          <Button
            className="w-full"
            disabled={loading || code.length !== 6}
            onClick={handleValidate}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
