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
import { DollarSign, Edit, Trash, PlusCircle, AreaChart } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../ui/empty-state';
import { FullScreenLoader } from '../ui/loader';

type ExchangeRate = Doc<"exchangeRates">;

const RateForm: React.FC<{ rate?: ExchangeRate; onSave: () => void }> = ({ rate, onSave }) => {
    const [fromCurrencyName, setFromCurrencyName] = useState(rate?.fromCurrencyName || '');
    const [fromCurrencyCode, setFromCurrencyCode] = useState(rate?.fromCurrencyCode || '');
    const [toCurrencyName, setToCurrencyName] = useState(rate?.toCurrencyName || '');
    const [toCurrencyCode, setToCurrencyCode] = useState(rate?.toCurrencyCode || '');

    const [minRate, setMinRate] = useState(rate?.minRate || 0);
    const [maxRate, setMaxRate] = useState(rate?.maxRate || 0);
    const [currentMarketRate, setCurrentMarketRate] = useState(rate?.currentMarketRate || 0);
    const upsertRate = useMutation(api.exchangeRates.upsertExchangeRate);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromCurrencyName || !fromCurrencyCode || !toCurrencyName || !toCurrencyCode || maxRate <= 0 || currentMarketRate <= 0) {
            toast.error("Please fill all required fields.");
            return;
        }
        try {
            await upsertRate({
                fromCurrencyName,
                fromCurrencyCode,
                toCurrencyName,
                toCurrencyCode,
                minRate,
                maxRate,
                currentMarketRate,
            });
            toast.success(`Rate for ${fromCurrencyCode}-${toCurrencyCode} saved.`);
            onSave();
        } catch (error) {
            console.error("Failed to save rate:", error);
            toast.error("Failed to save rate.");
        }
    };

    const fromCode = fromCurrencyCode || 'SOURCE';
    const toCode = toCurrencyCode || 'TARGET';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyName">From Currency Name</Label>
                    <Input id="fromCurrencyName" value={fromCurrencyName} onChange={(e) => setFromCurrencyName(e.target.value)} placeholder="e.g. United States Dollar" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyCode">From Currency Code</Label>
                    <Input id="fromCurrencyCode" value={fromCurrencyCode} onChange={(e) => setFromCurrencyCode(e.target.value.toUpperCase())} placeholder="e.g. USD" disabled={!!rate} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyName">To Currency Name</Label>
                    <Input id="toCurrencyName" value={toCurrencyName} onChange={(e) => setToCurrencyName(e.target.value)} placeholder="e.g. Nigerian Naira" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyCode">To Currency Code</Label>
                    <Input id="toCurrencyCode" value={toCurrencyCode} onChange={(e) => setToCurrencyCode(e.target.value.toUpperCase())} placeholder="e.g. NGN" disabled={!!rate} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="currentMarketRate">Current Market Rate</Label>
                <Input id="currentMarketRate" type="number" value={currentMarketRate} onChange={(e) => setCurrentMarketRate(parseFloat(e.target.value))} />
                <p className="text-xs text-whatsapp-text-muted">This is for your reference only and is not used by the bot for negotiation.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="minRate">Your Minimum Rate</Label>
                    <Input id="minRate" type="number" value={minRate} onChange={(e) => setMinRate(parseFloat(e.target.value))} />
                    <p className="text-xs text-whatsapp-text-muted">
                        The bot will not offer less than this.
                        <br />
                        (e.g., for 1 {fromCode}, you'll pay at least this amount in {toCode})
                    </p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="maxRate">Your Maximum Rate</Label>
                    <Input id="maxRate" type="number" value={maxRate} onChange={(e) => setMaxRate(parseFloat(e.target.value))} />
                    <p className="text-xs text-whatsapp-text-muted">
                        The bot will not offer more than this.
                        <br />
                        (e.g., for 1 {fromCode}, you'll pay at most this amount in {toCode})
                    </p>
                </div>
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
    const rates = useQuery(api.exchangeRates.getAllExchangeRates);
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
                {rates === undefined && <FullScreenLoader message="Loading rates..." />}
                {rates && rates.length === 0 && (
                    <EmptyState
                        icon={<AreaChart />}
                        title="No Exchange Rates"
                        message="Get started by adding your first exchange rate."
                    />
                )}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {rates?.map(rate => (
                        <Card key={rate._id} className="bg-whatsapp-panel-bg border-whatsapp-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign /> {rate.currencyPair}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2 text-sm">
                                <div>
                                    <p><strong>Your Offer Range</strong></p>
                                    <p className="text-lg font-semibold">{rate.minRate} - {rate.maxRate} {rate.toCurrencyCode}</p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        For every 1 {rate.fromCurrencyCode}, the bot will offer between {rate.minRate} and {rate.maxRate} {rate.toCurrencyCode}.
                                    </p>
                                </div>
                                <div>
                                    <p><strong>Market Rate (Reference)</strong></p>
                                    <p>{rate.currentMarketRate}</p>
                                </div>
                                <p className="text-xs text-whatsapp-text-muted pt-2">Last Updated: {new Date(rate.lastUpdated).toLocaleString()}</p>
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
