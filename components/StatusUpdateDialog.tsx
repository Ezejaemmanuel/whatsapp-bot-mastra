import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { TransactionStatus } from '@/convex/schemaUnions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Clock, MessageCircle, XCircle, AlertCircle } from 'lucide-react';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Doc<"transactions"> & {
    user?: {
      profileName?: string;
      phoneNumber?: string;
    };
  };
}

const transactionStatuses: TransactionStatus[] = [
  "pending",
  "image_received_and_being_reviewed",
  "confirmed_and_money_sent_to_user",
  "cancelled",
  "failed"
];

const statusDisplayNames: Record<TransactionStatus, string> = {
  "pending": "Pending",
  "image_received_and_being_reviewed": "Image Review",
  "confirmed_and_money_sent_to_user": "Completed",
  "cancelled": "Cancelled",
  "failed": "Failed"
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed_and_money_sent_to_user':
      return <CheckCircle className="w-4 h-4 text-whatsapp-success" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'image_received_and_being_reviewed':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-gray-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'image_received_and_being_reviewed':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    case 'confirmed_and_money_sent_to_user':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'cancelled':
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  }
};

const getDefaultMessage = (status: TransactionStatus, transaction: Doc<"transactions"> & {
  user?: {
    profileName?: string;
    phoneNumber?: string;
  };
}): string => {
  const transactionDetails = `\n\nTransaction ID: ${transaction._id.slice(-8)}\nAmount: ${transaction.amountFrom} ${transaction.currencyFrom}`;

  switch (status) {
    case 'confirmed_and_money_sent_to_user':
      return `✅ Good news! Your transaction has been confirmed, and the funds have been sent to your account.${transactionDetails}`;
    case 'cancelled':
      return `❌ Your transaction has been cancelled. If you have any questions, please contact support.${transactionDetails}`;
    case 'failed':
      return `❌ Your transaction has failed. Please contact support for assistance.${transactionDetails}`;
    case 'image_received_and_being_reviewed':
      return `📋 Your transaction is being reviewed. We'll update you once the review is complete.${transactionDetails}`;
    case 'pending':
      return `⏳ Your transaction is pending. We'll notify you of any updates.${transactionDetails}`;
    default:
      return `Your transaction status has been updated.${transactionDetails}`;
  }
};

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>(transaction.status);
  const [customMessage, setCustomMessage] = useState(() => getDefaultMessage(transaction.status, transaction));

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedStatus(transaction.status);
      setCustomMessage(getDefaultMessage(transaction.status, transaction));
    }
  }, [isOpen, transaction]);

  // Update message when status changes
  React.useEffect(() => {
    if (selectedStatus !== transaction.status) {
      setCustomMessage(getDefaultMessage(selectedStatus, transaction));
    }
  }, [selectedStatus, transaction]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ transactionId, status, message }: {
      transactionId: Id<"transactions">;
      status: TransactionStatus;
      message?: string;
    }) => {
      const response = await fetch('/api/transactions/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          status,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update transaction status');
      }

      return response.json();
    },
    onSuccess: () => {
      onClose();
    },
  });

  const handleConfirm = () => {
    const shouldSendMessage = shouldShowMessageInput;

    const promise = updateStatusMutation.mutateAsync({
      transactionId: transaction._id,
      status: selectedStatus,
      message: shouldSendMessage ? customMessage : undefined,
    });

    toast.promise(promise, {
      loading: 'Updating transaction status...',
      success: () => {
        const statusName = statusDisplayNames[selectedStatus];
        const willSendMessage = shouldSendMessage && transaction.user?.phoneNumber;
        return `Transaction status updated to ${statusName}${willSendMessage ? ' and notification sent' : ''}`;
      },
      error: (error) => `Failed to update status: ${error.message}`,
    });
  };

  const shouldShowMessageInput = selectedStatus === 'confirmed_and_money_sent_to_user' ||
    selectedStatus === 'cancelled' ||
    selectedStatus === 'failed';

  const willSendNotification = shouldShowMessageInput && transaction.user?.phoneNumber;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel border border-whatsapp-border/50 backdrop-blur-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-whatsapp-text-primary text-xl font-bold">
            Update Transaction Status
          </DialogTitle>
          <DialogDescription className="text-whatsapp-text-muted">
            Update the status for transaction {transaction._id.slice(-8)} - {transaction.user?.profileName || 'Unknown User'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <div className="glass-panel p-4 rounded-xl border border-whatsapp-border/30 space-y-3">
            <h4 className="font-semibold text-whatsapp-text-primary">Transaction Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-whatsapp-text-muted">From:</span>
                <span className="ml-2 font-semibold text-whatsapp-text-primary">
                  {transaction.amountFrom} {transaction.currencyFrom}
                </span>
              </div>
              <div>
                <span className="text-whatsapp-text-muted">To:</span>
                <span className="ml-2 font-semibold text-whatsapp-text-primary">
                  {transaction.amountTo} {transaction.currencyTo}
                </span>
              </div>
              <div>
                <span className="text-whatsapp-text-muted">User:</span>
                <span className="ml-2 font-semibold text-whatsapp-text-primary">
                  {transaction.user?.profileName || 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-whatsapp-text-muted">Phone:</span>
                <span className="ml-2 font-semibold text-whatsapp-text-primary">
                  {transaction.user?.phoneNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-3">
            <span className="text-whatsapp-text-muted font-medium">Current Status:</span>
            <Badge className={`${getStatusColor(transaction.status)} backdrop-blur-sm font-medium`}>
              <span className="flex items-center gap-1">
                {getStatusIcon(transaction.status)}
                {statusDisplayNames[transaction.status]}
              </span>
            </Badge>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status-select" className="text-whatsapp-text-primary font-medium">
              New Status
            </Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TransactionStatus)}>
              <SelectTrigger className="glass-panel border border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border border-whatsapp-border/50 backdrop-blur-xl">
                {transactionStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span>{statusDisplayNames[status]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Section */}
          {shouldShowMessageInput && (
            <div className="space-y-2">
              <Label htmlFor="message" className="text-whatsapp-text-primary font-medium">
                Notification Message
                {transaction.user?.phoneNumber ? (
                  <span className="text-whatsapp-text-muted text-sm ml-2">
                    (Will be sent to {transaction.user?.phoneNumber})
                  </span>
                ) : (
                  <span className="text-yellow-400 text-sm ml-2">
                    (No phone number available - message will be logged only)
                  </span>
                )}
              </Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter custom message..."
                className="glass-panel border border-whatsapp-border/50 focus:border-whatsapp-primary/50 transition-all duration-300 min-h-[120px]"
                rows={5}
              />
            </div>
          )}

          {!shouldShowMessageInput && selectedStatus !== transaction.status && (
            <div className="glass-panel p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <p className="text-blue-400 text-sm">
                ℹ️ No notification will be sent for this status change.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateStatusMutation.isPending}
            className="border-whatsapp-border/50 hover:border-whatsapp-primary/50 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={updateStatusMutation.isPending || selectedStatus === transaction.status}
            className="bg-gradient-to-r from-whatsapp-primary to-whatsapp-accent hover:from-whatsapp-primary/90 hover:to-whatsapp-accent/90 transition-all duration-300"
          >
            {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};