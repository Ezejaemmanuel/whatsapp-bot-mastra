import { Id } from "@/convex/_generated/dataModel";
import { TransactionStatus } from "@/convex/schemaUnions";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@radix-ui/react-dialog";
import { Send } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { DialogHeader, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface StatusUpdateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    statusInfo: { transactionId: Id<"transactions">; status: TransactionStatus } | null;
    onConfirm: (message?: string) => void;
}

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({ isOpen, onClose, statusInfo, onConfirm }) => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (statusInfo?.status === 'confirmed_and_money_sent_to_user') {
            setMessage('Your transaction has been processed and funds have been sent. Thank you for your business!');
        } else {
            setMessage('');
        }
    }, [statusInfo]);

    const needsDialog = statusInfo?.status === 'cancelled' || statusInfo?.status === 'confirmed_and_money_sent_to_user';

    useEffect(() => {
        if (!isOpen || !needsDialog) return;

        if (!needsDialog) {
            onConfirm();
        }
    }, [isOpen, statusInfo, needsDialog, onConfirm]);


    if (!isOpen || !statusInfo || !needsDialog) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-panel">
                <DialogHeader>
                    <DialogTitle>Update Transaction Status to &quot;{statusInfo.status.replace(/_/g, ' ')}&quot;</DialogTitle>
                    <DialogDescription>
                        {statusInfo.status === 'cancelled'
                            ? "Optionally, provide a reason for cancelling this transaction. This will be sent to the user."
                            : "You can send a custom message to the user or use the default one below."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="message" className="sr-only">
                        {statusInfo.status === 'cancelled' ? "Cancellation Reason" : "Message"}
                    </Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={statusInfo.status === 'cancelled' ? "e.g., Duplicate transaction..." : "Your message..."}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </DialogClose>
                    <Button onClick={() => onConfirm(message)}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Notification
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
