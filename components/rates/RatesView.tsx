"use client";
import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Edit, Trash, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

type ExchangeRate = Doc<"exchangeRates">;

const RateForm: React.FC<{ rate?: ExchangeRate; onSave: () => void }> = ({ rate, onSave }) => {
    const [currencyPair, setCurrencyPair] = useState(rate?.currencyPair || '');
    const [minRate, setMinRate] = useState(rate?.minRate || 0);
    const [maxRate, setMaxRate] = useState(rate?.maxRate || 0);
    const [currentMarketRate, setCurrentMarketRate] = useState(rate?.currentMarketRate || 0);
    const upsertRate = useMutation(api.exchangeRates.upsertExchangeRate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currencyPair || maxRate <= 0 || currentMarketRate <= 0) {
            toast.error("Please fill all required fields.");
            return;
        }
        try {
            await upsertRate({
                currencyPair,
                minRate,
                maxRate,
                currentMarketRate,
            });
            toast.success(`Rate for ${currencyPair} saved.`);
            onSave();
        } catch (error) {
            console.error("Failed to save rate:", error);
            toast.error("Failed to save rate.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="currencyPair">Currency Pair (e.g., USD-NGN)</Label>
                <Input id="currencyPair" value={currencyPair} onChange={(e) => setCurrencyPair(e.target.value.toUpperCase())} placeholder="USD-NGN" disabled={!!rate} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="currentMarketRate">Current Market Rate</Label>
                <Input id="currentMarketRate" type="number" value={currentMarketRate} onChange={(e) => setCurrentMarketRate(parseFloat(e.target.value))} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="minRate">Minimum Rate</Label>
                <Input id="minRate" type="number" value={minRate} onChange={(e) => setMinRate(parseFloat(e.target.value))} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="maxRate">Maximum Rate</Label>
                <Input id="maxRate" type="number" value={maxRate} onChange={(e) => setMaxRate(parseFloat(e.target.value))} />
            </div>
            <DialogFooter>
                <Button type="submit">Save Rate</Button>
            </DialogFooter>
        </form>
    )
}

const DeleteConfirmationDialog: React.FC<{ rate: ExchangeRate, onDeleted: () => void }> = ({ rate, onDeleted }) => {
    const deleteRate = useMutation(api.exchangeRates.deleteRate);
    const { toast } = useToast();

    const handleDelete = async () => {
        try {
            await deleteRate({ rateId: rate._id });
            toast({ title: "Success", description: `Rate for ${rate.currencyPair} deleted.` });
            onDeleted();
        } catch (error) {
            console.error("Failed to delete rate:", error);
            toast({ title: "Error", description: "Failed to delete rate.", variant: "destructive" });
        }
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
            </DialogHeader>
            <p>
                Are you sure you want to delete the rate for <strong>{rate.currencyPair}</strong>? This action cannot be undone.
            </p>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
        </DialogContent>
    )
}


export const RatesView: React.FC<{ isMobile?: boolean }> = ({ isMobile }) => {
    const rates = useQuery(api.exchangeRates.getAllActiveCurrencyPairs);
    const [isAddEditDialogOpen, setAddEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRate, setSelectedRate] = useState<ExchangeRate | undefined>(undefined);

    const handleEdit = (rate: ExchangeRate) => {
        setSelectedRate(rate);
        setAddEditDialogOpen(true);
    };

    const handleDelete = (rate: ExchangeRate) => {
        setSelectedRate(rate);
        setDeleteDialogOpen(true);
    }

    const handleAddNew = () => {
        setSelectedRate(undefined);
        setAddEditDialogOpen(true);
    }

    const onFormSaved = () => {
        setAddEditDialogOpen(false);
        setSelectedRate(undefined);
    }

    const onRateDeleted = () => {
        setDeleteDialogOpen(false);
        setSelectedRate(undefined);
    }

    return (
        <div className="h-full flex flex-col bg-whatsapp-chat-bg text-whatsapp-text-primary">
            <header className="flex items-center justify-between bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0">
                <h2 className="text-lg font-medium">Exchange Rates</h2>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew}><PlusCircle className="w-4 h-4 mr-2" /> Add New</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedRate ? 'Edit' : 'Add'} Exchange Rate</DialogTitle>
                        </DialogHeader>
                        <RateForm rate={selectedRate} onSave={onFormSaved} />
                    </DialogContent>
                </Dialog>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                {rates === undefined && <p>Loading rates...</p>}
                {rates && rates.length === 0 && <p>No active rates found.</p>}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {rates?.map(rate => (
                        <Card key={rate._id} className="bg-whatsapp-panel-bg border-whatsapp-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign /> {rate.currencyPair}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                                <p><strong>Market Rate:</strong> {rate.currentMarketRate}</p>
                                <p><strong>Min Rate:</strong> {rate.minRate}</p>
                                <p><strong>Max Rate:</strong> {rate.maxRate}</p>
                                <p className="text-xs text-whatsapp-text-muted">Last Updated: {new Date(rate.lastUpdated).toLocaleString()}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(rate)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                                <Dialog open={isDeleteDialogOpen && selectedRate?._id === rate._id} onOpenChange={(open) => !open && setSelectedRate(undefined)}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(rate)}><Trash className="w-4 h-4 mr-2" /> Delete</Button>
                                    </DialogTrigger>
                                    {selectedRate && <DeleteConfirmationDialog rate={selectedRate} onDeleted={onRateDeleted} />}
                                </Dialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
