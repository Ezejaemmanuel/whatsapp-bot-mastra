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
import { ScrollArea } from '@/components/ui/scroll-area';
import { DollarSign, Edit, Trash, PlusCircle, AreaChart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '../ui/empty-state';
import { FullScreenLoader } from '../ui/loader';

type ExchangeRate = Doc<"exchangeRates">;

const RateForm: React.FC<{ rate?: ExchangeRate; onSave: () => void }> = ({ rate, onSave }) => {
    const [fromCurrencyName, setFromCurrencyName] = useState(rate?.fromCurrencyName || '');
    const [fromCurrencyCode, setFromCurrencyCode] = useState(rate?.fromCurrencyCode || '');
    const [toCurrencyName, setToCurrencyName] = useState(rate?.toCurrencyName || '');
    const [toCurrencyCode, setToCurrencyCode] = useState(rate?.toCurrencyCode || '');

    // Buying rates (when we buy foreign currency from customer)
    const [buyingMinRate, setBuyingMinRate] = useState(rate?.buyingMinRate || 0);
    const [buyingMaxRate, setBuyingMaxRate] = useState(rate?.buyingMaxRate || 0);
    const [buyingCurrentMarketRate, setBuyingCurrentMarketRate] = useState(rate?.buyingCurrentMarketRate || 0);

    // Selling rates (when we sell foreign currency to customer)
    const [sellingMinRate, setSellingMinRate] = useState(rate?.sellingMinRate || 0);
    const [sellingMaxRate, setSellingMaxRate] = useState(rate?.sellingMaxRate || 0);
    const [sellingCurrentMarketRate, setSellingCurrentMarketRate] = useState(rate?.sellingCurrentMarketRate || 0);

    const [fromAmount, setFromAmount] = useState(1);
    const [toAmount, setToAmount] = useState(rate?.buyingCurrentMarketRate || 0);
    const [selectedRateType, setSelectedRateType] = useState<'buying' | 'selling'>('buying');

    const upsertRate = useMutation(api.exchangeRates.upsertExchangeRate);

    React.useEffect(() => {
        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            setToAmount(fromAmount * currentRate);
        }
    }, [buyingCurrentMarketRate, sellingCurrentMarketRate, fromAmount, selectedRateType]);

    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setFromAmount(value);
        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            setToAmount(value * currentRate);
        }
    };

    const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value) || 0;
        setToAmount(value);
        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            setFromAmount(value / currentRate);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromCurrencyName || !fromCurrencyCode || !toCurrencyName || !toCurrencyCode) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (buyingMinRate > buyingMaxRate) {
            toast.error("Buying minimum rate cannot be higher than the buying maximum rate.");
            return;
        }
        if (sellingMinRate > sellingMaxRate) {
            toast.error("Selling minimum rate cannot be higher than the selling maximum rate.");
            return;
        }
        if (buyingMaxRate <= 0 || sellingMaxRate <= 0) {
            toast.error("Please set valid rates for both buying and selling.");
            return;
        }
        try {
            await upsertRate({
                fromCurrencyName,
                fromCurrencyCode,
                toCurrencyName,
                toCurrencyCode,
                buyingMinRate,
                buyingMaxRate,
                buyingCurrentMarketRate,
                sellingMinRate,
                sellingMaxRate,
                sellingCurrentMarketRate,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyName">From Currency Name</Label>
                    <Input id="fromCurrencyName" value={fromCurrencyName} onChange={(e) => setFromCurrencyName(e.target.value)} placeholder="e.g. United States Dollar" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyCode">From Currency Code</Label>
                    <Input id="fromCurrencyCode" value={fromCurrencyCode} onChange={(e) => setFromCurrencyCode(e.target.value.toUpperCase())} placeholder="e.g. USD" disabled={!!rate} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyName">To Currency Name</Label>
                    <Input id="toCurrencyName" value={toCurrencyName} onChange={(e) => setToCurrencyName(e.target.value)} placeholder="e.g. Nigerian Naira" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyCode">To Currency Code</Label>
                    <Input id="toCurrencyCode" value={toCurrencyCode} onChange={(e) => setToCurrencyCode(e.target.value.toUpperCase())} placeholder="e.g. NGN" disabled={!!rate} />
                </div>
            </div>

            {/* Buying Rates Section */}
            <Card className="bg-whatsapp-conversation-bg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-green-600">Buying Rates</h3>
                    <span className="text-xs text-whatsapp-text-muted">(When we buy foreign currency from customer)</span>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="buyingCurrentMarketRate">Current Market Buying Rate</Label>
                    <Input id="buyingCurrentMarketRate" type="number" value={buyingCurrentMarketRate} onChange={(e) => setBuyingCurrentMarketRate(parseFloat(e.target.value) || 0)} />
                    <p className="text-xs text-whatsapp-text-muted">
                        This is for reference and powers the live preview below.
                        {buyingCurrentMarketRate > 0 && <>
                            <br />
                            (e.g., at this rate, 1 {fromCode} is worth {buyingCurrentMarketRate} {toCode})
                        </>}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="buyingMinRate">Your Minimum Buying Rate</Label>
                        <Input id="buyingMinRate" type="number" value={buyingMinRate} onChange={(e) => setBuyingMinRate(parseFloat(e.target.value) || 0)} />
                        <p className="text-xs text-whatsapp-text-muted">
                            The bot will not buy for less than this.
                            {buyingMinRate > 0 && <>
                                <br />
                                (e.g., for 1 {fromCode}, you&apos;ll pay at least {buyingMinRate} {toCode})
                            </>}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="buyingMaxRate">Your Maximum Buying Rate</Label>
                        <Input id="buyingMaxRate" type="number" value={buyingMaxRate} onChange={(e) => setBuyingMaxRate(parseFloat(e.target.value) || 0)} />
                        <p className="text-xs text-whatsapp-text-muted">
                            The bot will not buy for more than this.
                            {buyingMaxRate > 0 && <>
                                <br />
                                (e.g., for 1 {fromCode}, you&apos;ll pay at most {buyingMaxRate} {toCode})
                            </>}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Selling Rates Section */}
            <Card className="bg-whatsapp-conversation-bg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-red-600">Selling Rates</h3>
                    <span className="text-xs text-whatsapp-text-muted">(When we sell foreign currency to customer)</span>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="sellingCurrentMarketRate">Current Market Selling Rate</Label>
                    <Input id="sellingCurrentMarketRate" type="number" value={sellingCurrentMarketRate} onChange={(e) => setSellingCurrentMarketRate(parseFloat(e.target.value) || 0)} />
                    <p className="text-xs text-whatsapp-text-muted">
                        This is for reference and powers the live preview below.
                        {sellingCurrentMarketRate > 0 && <>
                            <br />
                            (e.g., at this rate, 1 {fromCode} is worth {sellingCurrentMarketRate} {toCode})
                        </>}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="sellingMinRate">Your Minimum Selling Rate</Label>
                        <Input id="sellingMinRate" type="number" value={sellingMinRate} onChange={(e) => setSellingMinRate(parseFloat(e.target.value) || 0)} />
                        <p className="text-xs text-whatsapp-text-muted">
                            The bot will not sell for less than this.
                            {sellingMinRate > 0 && <>
                                <br />
                                (e.g., for 1 {fromCode}, you&apos;ll charge at least {sellingMinRate} {toCode})
                            </>}
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sellingMaxRate">Your Maximum Selling Rate</Label>
                        <Input id="sellingMaxRate" type="number" value={sellingMaxRate} onChange={(e) => setSellingMaxRate(parseFloat(e.target.value) || 0)} />
                        <p className="text-xs text-whatsapp-text-muted">
                            The bot will not sell for more than this.
                            {sellingMaxRate > 0 && <>
                                <br />
                                (e.g., for 1 {fromCode}, you&apos;ll charge at most {sellingMaxRate} {toCode})
                            </>}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Live Preview */}
            <Card className="bg-whatsapp-conversation-bg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold">Live Preview</h3>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={selectedRateType === 'buying' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedRateType('buying')}
                        >
                            Buying
                        </Button>
                        <Button
                            type="button"
                            variant={selectedRateType === 'selling' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedRateType('selling')}
                        >
                            Selling
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                    <div className='grid gap-2'>
                        <Label>{fromCode || "From"}</Label>
                        <Input type="number" value={fromAmount} onChange={handleFromAmountChange} />
                    </div>
                    <div className='grid gap-2'>
                        <Label>{toCode || "To"}</Label>
                        <Input type="number" value={toAmount} onChange={handleToAmountChange} />
                    </div>
                </div>
                <p className="text-xs text-whatsapp-text-muted mt-2">
                    Preview using {selectedRateType} rate: {(selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate).toFixed(2)}
                </p>
            </Card>

            {(buyingMinRate > buyingMaxRate || sellingMinRate > sellingMaxRate) && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <p>
                        {buyingMinRate > buyingMaxRate && "Buying minimum rate cannot be higher than the buying maximum rate. "}
                        {sellingMinRate > sellingMaxRate && "Selling minimum rate cannot be higher than the selling maximum rate."}
                    </p>
                </div>
            )}

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
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0 gap-3">
                <h2 className="text-lg font-medium">Exchange Rates</h2>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircle className="w-4 h-4 mr-2" /> Add New</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-hidden">
                        <DialogHeader>
                            <DialogTitle>{selectedRate ? 'Edit' : 'Add'} Exchange Rate</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[calc(90vh-120px)]">
                            <div className="pr-4">
                                <RateForm rate={selectedRate} onSave={onFormSaved} />
                            </div>
                        </ScrollArea>
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
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {rates?.map(rate => (
                        <Card key={rate._id} className="bg-whatsapp-panel-bg border-whatsapp-border">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign /> {rate.currencyPair}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm">
                                {/* Buying Rates */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <p className="font-semibold text-green-600 mb-2">Buying Rates</p>
                                    <p className="text-lg font-semibold">{rate.buyingMinRate} - {rate.buyingMaxRate} {rate.toCurrencyCode}</p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        For every 1 {rate.fromCurrencyCode}, we buy between {rate.buyingMinRate} and {rate.buyingMaxRate} {rate.toCurrencyCode}.
                                    </p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        Market Rate: {rate.buyingCurrentMarketRate}
                                    </p>
                                </div>

                                {/* Selling Rates */}
                                <div className="border-l-4 border-red-500 pl-4">
                                    <p className="font-semibold text-red-600 mb-2">Selling Rates</p>
                                    <p className="text-lg font-semibold">{rate.sellingMinRate} - {rate.sellingMaxRate} {rate.toCurrencyCode}</p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        For every 1 {rate.fromCurrencyCode}, we sell between {rate.sellingMinRate} and {rate.sellingMaxRate} {rate.toCurrencyCode}.
                                    </p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        Market Rate: {rate.sellingCurrentMarketRate}
                                    </p>
                                </div>

                                <p className="text-xs text-whatsapp-text-muted pt-2">Last Updated: {new Date(rate.lastUpdated).toLocaleString()}</p>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(rate)} className="w-full sm:w-auto"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                                <Dialog open={isDeleteDialogOpen && selectedRate?._id === rate._id} onOpenChange={(open) => !open && setSelectedRate(undefined)}>
                                    <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(rate)} className="w-full sm:w-auto"><Trash className="w-4 h-4 mr-2" /> Delete</Button>
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
