"use client";
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Landmark, Edit, Trash, PlusCircle, Star, CheckCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { EmptyState } from '../ui/empty-state';
import { FullScreenLoader } from '../ui/loader';

type BankDetails = Doc<"adminBankDetails">;

const BankDetailsForm: React.FC<{ detail?: BankDetails; onSave: () => void }> = ({ detail, onSave }) => {
    const [bankName, setBankName] = useState(detail?.bankName || '');
    const [accountName, setAccountName] = useState(detail?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(detail?.accountNumber || '');
    const [description, setDescription] = useState(detail?.description || '');
    const [accountType, setAccountType] = useState<'buy' | 'sell' | 'both'>(detail?.accountType || 'both');

    const upsertDetails = useMutation(api.adminBankDetails.upsertAdminBankDetails);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bankName || !accountName || !accountNumber) {
            toast.error("Please fill all required fields.");
            return;
        }
        try {
            await upsertDetails({
                _id: detail?._id,
                bankName,
                accountName,
                accountNumber,
                description,
                accountType,
            });
            toast.success("Bank details saved.");
            onSave();
        } catch (error) {
            console.error("Failed to save details:", error);
            toast.error("Failed to save bank details.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g., Central Bank" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g., John Doe" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g., 1234567890" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="accountType">Account Type</Label>
                <select
                    id="accountType"
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as 'buy' | 'sell' | 'both')}
                    className="border rounded px-2 py-1"
                >
                    <option value="buy">Buy (for buying currency)</option>
                    <option value="sell">Sell (for selling currency)</option>
                    <option value="both">Both</option>
                </select>
            </div>
            <DialogFooter>
                <Button type="submit">Save Details</Button>
            </DialogFooter>
        </form>
    )
}

const DeleteConfirmationDialog: React.FC<{ detail: BankDetails, onDeleted: () => void }> = ({ detail, onDeleted }) => {
    const deleteDetails = useMutation(api.adminBankDetails.deleteAdminBankDetails);

    const handleDelete = async () => {
        try {
            await deleteDetails({ bankDetailsId: detail._id });
            toast.success("Bank details deleted.");
            onDeleted();
        } catch (error) {
            console.error("Failed to delete details:", error);
            toast.error("Failed to delete bank details.");
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to delete the account <strong>{detail.accountNumber} ({detail.bankName})</strong>?</p>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
    )
}


export const BankDetailsView: React.FC<{ isMobile?: boolean }> = () => {
    const bankDetails = useQuery(api.adminBankDetails.getAllAdminBankDetails);

    const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<BankDetails | undefined>(undefined);

    const handleEdit = (detail: BankDetails) => {
        setSelectedDetail(detail);
        setAddEditDialogOpen(true);
    };

    const handleDelete = (detail: BankDetails) => {
        setSelectedDetail(detail);
        setDeleteDialogOpen(true);
    }

    const handleAddNew = () => {
        setSelectedDetail(undefined);
        setAddEditDialogOpen(true);
    }

    const onFormSaved = () => {
        setAddEditDialogOpen(false);
        setSelectedDetail(undefined);
    }

    const onDetailDeleted = () => {
        setDeleteDialogOpen(false);
        setSelectedDetail(undefined);
    }

    return (
        <div className="h-full flex flex-col bg-whatsapp-chat-bg text-whatsapp-text-primary">
            <header className="flex items-center justify-between bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0">
                <h2 className="text-lg font-medium">Bank Account Details</h2>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew}><PlusCircle className="w-4 h-4 mr-2" /> Add New</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedDetail ? 'Edit' : 'Add'} Bank Details</DialogTitle>
                        </DialogHeader>
                        <BankDetailsForm detail={selectedDetail} onSave={onFormSaved} />
                    </DialogContent>
                </Dialog>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {bankDetails === undefined && <FullScreenLoader message="Loading bank details..." />}
                {bankDetails && bankDetails.length === 0 && (
                    <EmptyState
                        icon={<Landmark />}
                        title="No Bank Details"
                        message="Add your first bank account to get started."
                    />
                )}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {bankDetails?.map(detail => (
                        <Card key={detail._id} className="bg-whatsapp-panel-bg border-whatsapp-border">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Landmark /> {detail.bankName}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                                <p><strong>A/C Name:</strong> {detail.accountName}</p>
                                <p><strong>A/C Number:</strong> {detail.accountNumber}</p>
                                {detail.description && <p><strong>Desc:</strong> {detail.description}</p>}
                                <p><strong>Account Type:</strong> {detail.accountType === 'buy' ? 'Buy' : detail.accountType === 'sell' ? 'Sell' : 'Both'}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(detail)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                                <Dialog open={isDeleteDialogOpen && selectedDetail?._id === detail._id} onOpenChange={(open) => !open && setSelectedDetail(undefined)}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(detail)}><Trash className="w-4 h-4 mr-2" /> Delete</Button>
                                    </DialogTrigger>
                                    {selectedDetail && <DeleteConfirmationDialog detail={selectedDetail} onDeleted={onDetailDeleted} />}
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
