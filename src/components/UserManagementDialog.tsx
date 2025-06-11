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
  phone: string; // رقم المستخدم أو المعرف (966xxxx@c.us)
  timestamp?: number; // أول مطالبة كعدد millis
  readable_timestamp?: string; // أول مطالبة كنص (2025/06/11:05:59:14)
  code_claimed?: number; // عدد الأكواد اللي طالبها
  timestamp_code_claimed?: number; // آخر وقت مطالبة كعدد millis
  readable_timestamp_code_claimed?: string; // آخر وقت مطالبة كنص
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
    <TableRow>
      <TableHead>رقم المستخدم</TableHead>
      <TableHead>تاريخ أول مطالبة</TableHead>
      <TableHead>عدد الأكواد المطلوبة</TableHead>
      <TableHead>تاريخ آخر مطالبة كود</TableHead>
      <TableHead>إجراءات</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => {
      // استخراج رقم الجوال بشكل أوضح
      let displayPhone = user.phone || user.phone || "-";
      if (displayPhone.endsWith("@c.us")) {
        let raw = displayPhone.replace("@c.us", "");
        if (raw.startsWith("966")) {
          raw = "0" + raw.slice(3);
        }
        displayPhone = raw;
      }

      // أول مطالبة
      let firstClaim = "-";
      if (user.readable_timestamp) {
        firstClaim = user.readable_timestamp;
      } else if (user.timestamp) {
        firstClaim = new Date(user.timestamp).toLocaleString("en-GB");
      }

      // عدد الأكواد المطلوبة
      const codeClaimed = user.code_claimed || 0;

      // آخر مطالبة كود
      let lastClaim = "-";
      if (user.readable_timestamp_code_claimed) {
        lastClaim = user.readable_timestamp_code_claimed;
      } else if (user.timestamp_code_claimed) {
        lastClaim = new Date(user.timestamp_code_claimed).toLocaleString("en-GB");
      }

      return (
        <TableRow key={user.phone || user.phone}>
          <TableCell>{displayPhone}</TableCell>
          <TableCell>{firstClaim}</TableCell>
          <TableCell>{codeClaimed}</TableCell>
          <TableCell>{lastClaim}</TableCell>
          <TableCell>
            <Button variant="outline" size="sm">
              Reset
            </Button>
          </TableCell>
        </TableRow>
      );
    })}
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