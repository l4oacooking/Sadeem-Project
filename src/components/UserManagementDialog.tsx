import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/use-translation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, RefreshCw, RefreshCcw,  Phone, Clock, User, AlertTriangle, Eraser } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Ensure this import is at the top

interface User {
  number: string;
  timestamp: string;
  code_claimed: number;
  timestamp_code: string;
  account_assigned: string;
}

interface UserManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  accountId: string;
  users: User[];
  onDeleteUser: (accountId: string, userNumber: string) => void;
  onResetUserTwoFALimit: (accountId: string, userNumber: string) => void;
  onUpdateUsers: (accountId: string, users: User[]) => void;
  accounts: any[]; // ✅
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>; // ✅
}

export default function UserManagementDialog({
  isOpen,
  onClose,
  accountName,
  accountId,
  users,
  onDeleteUser,
  onResetUserTwoFALimit,
  onUpdateUsers,
  accounts,
  setAccounts
}: UserManagementDialogProps) {
  const { t } = useTranslation();
  const [confirmingEraseAll, setConfirmingEraseAll] = useState(false);

  const handleEraseAllUsers = () => {
    if (confirmingEraseAll) {
      onUpdateUsers(accountId, []);
      setConfirmingEraseAll(false);
      toast.success(t('All users have been erased'));
    } else {
      setConfirmingEraseAll(true);
      // Auto-reset after 3 seconds
      setTimeout(() => setConfirmingEraseAll(false), 3000);
    }
  };

  const handleResetAllTwoFALimits = () => {
    if (users.length === 0) {
      toast.error(t('No users to reset'));
      return;
    }

    const updatedUsers = users.map(user => ({
      ...user,
      code_claimed: 1,
      timestamp_code: new Date().toISOString()
    }));
    
    onUpdateUsers(accountId, updatedUsers);
    toast.success(t('All user 2FA limits have been reset'));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString; // Return as is if parsing fails
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#101113] text-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('Manage Users for Account')}: {accountName}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t('View and manage users who have claimed codes from this account')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex justify-between gap-2">
            <Button 
              onClick={handleEraseAllUsers} 
              variant={confirmingEraseAll ? "destructive" : "outline"}
              className="flex-1"
            >
              {confirmingEraseAll ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {t('Confirm Erase All Users')}
                </>
              ) : (
                <>
                  <Eraser className="h-4 w-4 mr-2" />
                  {t('Erase All Users')}
                </>
              )}
            </Button>
            <Button
  variant="outline"
  onClick={async () => {
    if (!accountId) return;

    const account = accounts.find((a) => a.id === accountId);
    if (!account || !account.users) return;

    const updatedUsers = account.users.map((user) => ({
      ...user,
      code_claimed: 0,
      timestamp_code: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('accounts')
      .update({ users: updatedUsers })
      .eq('id', accountId);

    if (error) {
      toast.error('Failed to reset 2FA limits');
    } else {
      toast.success('All 2FA limits reset');
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, users: updatedUsers } : acc
        )
      );
    }
  }}
>
  Reset All 2FA Limits <RefreshCcw className="ml-2 h-4 w-4" />
</Button>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1a1b1e]">
                  <TableHead className="text-gray-400">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {t('Phone Number')}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t('First Claim Time')}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-400">{t('Codes Claimed')}</TableHead>
                  <TableHead className="text-gray-400">{t('Last Claim Time')}</TableHead>
                  <TableHead className="text-right text-gray-400">{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                      {t('No users have claimed codes from this account yet')}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={`${user.number}-${index}`} className="border-t border-border/40">
                      <TableCell className="font-medium">{user.number}</TableCell>
                      <TableCell>{formatDate(user.timestamp)}</TableCell>
                      <TableCell className="text-center">{user.code_claimed}</TableCell>
                      <TableCell>{formatDate(user.timestamp_code)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => onResetUserTwoFALimit(accountId, user.number)}
                            title={t('Reset 2FA Limit')}
                          >
                            <RefreshCw className="h-4 w-4 text-blue-400" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => onDeleteUser(accountId, user.number)}
                            title={t('Delete User')}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            {t('Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 