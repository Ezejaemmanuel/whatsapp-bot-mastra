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
import { Landmark, Edit, Trash, PlusCircle, Star, CheckCircle, CreditCard, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { EmptyState } from '../ui/empty-state';
import { FullScreenLoader } from '../ui/loader';

type BankDetails = Doc<"adminBankDetails">;

const BankDetailsForm: React.FC<{ detail?: BankDetails; onSave: () => void }> = ({ detail, onSave }) => {
    const [bankName, setBankName] = useState(detail?.bankName || '');
    const [accountName, setAccountName] = useState(detail?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(detail?.accountNumber || '');
    const [description, setDescription] = useState(detail?.description || '');
    const [accountType, setAccountType] = useState<'buy' | 'sell'>(detail?.accountType || 'buy');

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-3">
                <Label htmlFor="bankName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Landmark className="w-4 h-4 inline mr-2" />
                    Bank Name
                </Label>
                <Input 
                    id="bankName" 
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                    placeholder="e.g., Central Bank" 
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
            <div className="grid gap-3">
                <Label htmlFor="accountName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Star className="w-4 h-4 inline mr-2" />
                    Account Name
                </Label>
                <Input 
                    id="accountName" 
                    value={accountName} 
                    onChange={(e) => setAccountName(e.target.value)} 
                    placeholder="e.g., John Doe" 
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
            <div className="grid gap-3">
                <Label htmlFor="accountNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Account Number
                </Label>
                <div className="relative">
                    <Input 
                        id="accountNumber" 
                        value={accountNumber} 
                        onChange={(e) => setAccountNumber(e.target.value)} 
                        placeholder="e.g., 1234567890" 
                        className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-2 hover:border-blue-300 focus:shadow-lg"
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>
            
            <div className="grid gap-3">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                </Label>
                <Input 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Optional description" 
                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
            <div className="grid gap-3">
                <Label htmlFor="accountType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Type
                </Label>
                <Select value={accountType} onValueChange={(value) => setAccountType(value as 'buy' | 'sell')}>
                    <SelectTrigger className="w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-2 hover:border-blue-300 focus:shadow-lg">
                        <div className="flex items-center gap-2">
                            {accountType === 'buy' ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                            <SelectValue placeholder="Select account type" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="buy" className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span>Buy (for buying currency)</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="sell" className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-red-500" />
                                <span>Sell (for selling currency)</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <DialogFooter className="pt-4">
                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Details
                </Button>
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
                                <p><strong>Account Type:</strong> {detail.accountType === 'buy' ? 'Buy' : 'Sell'}</p>
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
