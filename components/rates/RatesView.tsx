"use client";
import React, { useState, useEffect } from 'react';
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
    const [buyingCurrentMarketRate, setBuyingCurrentMarketRate] = useState(rate?.buyingCurrentMarketRate || 0);
    const [buyingRateInput, setBuyingRateInput] = useState(rate?.buyingCurrentMarketRate?.toString() || '');

    // Selling rates (when we sell foreign currency to customer)
    const [sellingCurrentMarketRate, setSellingCurrentMarketRate] = useState(rate?.sellingCurrentMarketRate || 0);
    const [sellingRateInput, setSellingRateInput] = useState(rate?.sellingCurrentMarketRate?.toString() || '');

    const [fromAmount, setFromAmount] = useState(1);
    const [fromAmountInput, setFromAmountInput] = useState('1');
    const [toAmount, setToAmount] = useState(rate?.buyingCurrentMarketRate ? parseFloat((1 * rate.buyingCurrentMarketRate).toFixed(4)) : 0);
    const [toAmountInput, setToAmountInput] = useState(rate?.buyingCurrentMarketRate ? (1 * rate.buyingCurrentMarketRate).toFixed(4) : '');
    const [selectedRateType, setSelectedRateType] = useState<'buying' | 'selling'>('buying');

    const upsertRate = useMutation(api.exchangeRates.upsertExchangeRate);

    // Handle mobile keyboard viewport issues
    useEffect(() => {
        const handleViewportChange = () => {
            // Force viewport recalculation on mobile
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            }
        };

        // Add event listeners for mobile keyboard
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('orientationchange', handleViewportChange);

        return () => {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('orientationchange', handleViewportChange);
        };
    }, []);

    React.useEffect(() => {
        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            const calculatedAmount = parseFloat((fromAmount * currentRate).toFixed(4));
            setToAmount(calculatedAmount);
            setToAmountInput(calculatedAmount.toString());
        }
    }, [buyingCurrentMarketRate, sellingCurrentMarketRate, fromAmount, selectedRateType]);

    // Real-time input validation and formatting
    const validateAndFormatInput = (value: string): string => {
        // Convert comma to period immediately
        let formatted = value.replace(/,/g, '.');

        // Only allow numbers and periods
        formatted = formatted.replace(/[^0-9.]/g, '');

        // Handle multiple periods - keep only the first one
        const periodCount = (formatted.match(/\./g) || []).length;
        if (periodCount > 1) {
            const parts = formatted.split('.');
            formatted = parts[0] + '.' + parts.slice(1).join('');
        }

        return formatted;
    };

    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedValue = validateAndFormatInput(rawValue);

        // Update the input display with formatted value
        setFromAmountInput(formattedValue);

        // Process the formatted value for calculations
        const value = formattedValue === '' ? 0 : parseFloat(formattedValue) || 0;
        setFromAmount(value);

        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            const calculatedAmount = parseFloat((value * currentRate).toFixed(4));
            setToAmount(calculatedAmount);
            setToAmountInput(calculatedAmount.toString());
        }
    };

    const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedValue = validateAndFormatInput(rawValue);

        // Update the input display with formatted value
        setToAmountInput(formattedValue);

        // Process the formatted value for calculations
        const value = formattedValue === '' ? 0 : parseFloat(formattedValue) || 0;
        setToAmount(value);

        const currentRate = selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate;
        if (currentRate > 0) {
            const calculatedAmount = parseFloat((value / currentRate).toFixed(4));
            setFromAmount(calculatedAmount);
            setFromAmountInput(calculatedAmount.toString());
        }
    };

    const handleBuyingRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedValue = validateAndFormatInput(rawValue);

        // Update the input display with formatted value
        setBuyingRateInput(formattedValue);

        // Process the formatted value for calculations
        const value = formattedValue === '' ? 0 : parseFloat(formattedValue) || 0;
        setBuyingCurrentMarketRate(value);
    };

    const handleSellingRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        const formattedValue = validateAndFormatInput(rawValue);

        // Update the input display with formatted value
        setSellingRateInput(formattedValue);

        const value = formattedValue === '' ? 0 : parseFloat(formattedValue) || 0;
        setSellingCurrentMarketRate(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromCurrencyName || !fromCurrencyCode || !toCurrencyName || !toCurrencyCode) {
            toast.error("Please fill all required fields.");
            return;
        }
        if (buyingCurrentMarketRate <= 0 || sellingCurrentMarketRate <= 0) {
            toast.error("Please set valid rates for both buying and selling.");
            return;
        }
        try {
            await upsertRate({
                fromCurrencyName,
                fromCurrencyCode,
                toCurrencyName,
                toCurrencyCode,
                buyingCurrentMarketRate,
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
        <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyName">From Currency Name</Label>
                    <Input
                        id="fromCurrencyName"
                        value={fromCurrencyName}
                        onChange={(e) => setFromCurrencyName(e.target.value)}
                        placeholder="e.g. United States Dollar"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="fromCurrencyCode">From Currency Code</Label>
                    <Input
                        id="fromCurrencyCode"
                        value={fromCurrencyCode}
                        onChange={(e) => setFromCurrencyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. USD"
                        disabled={!!rate}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyName">To Currency Name</Label>
                    <Input
                        id="toCurrencyName"
                        value={toCurrencyName}
                        onChange={(e) => setToCurrencyName(e.target.value)}
                        placeholder="e.g. Nigerian Naira"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="toCurrencyCode">To Currency Code</Label>
                    <Input
                        id="toCurrencyCode"
                        value={toCurrencyCode}
                        onChange={(e) => setToCurrencyCode(e.target.value.toUpperCase())}
                        placeholder="e.g. NGN"
                        disabled={!!rate}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </div>
            </div>

            {/* Buying Rates Section */}
            <Card className="bg-whatsapp-conversation-bg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-green-600">Buying Rate</h3>
                    <span className="text-xs text-whatsapp-text-muted">(When we buy foreign currency from customer)</span>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="buyingCurrentMarketRate">Current Market Buying Rate</Label>
                    <Input
                        id="buyingCurrentMarketRate"
                        type="text"
                        value={buyingRateInput}
                        onChange={handleBuyingRateChange}
                        placeholder="0.0000"
                    />
                    <p className="text-xs text-whatsapp-text-muted">
                        This is for reference and powers the live preview below.
                        <br />
                        <span className="text-blue-500">💡 Tip: You can use comma (,) as decimal separator</span>
                        {buyingCurrentMarketRate > 0 && <>
                            <br />
                            (e.g., at this rate, 1 {fromCode} is worth {buyingCurrentMarketRate.toFixed(4)} {toCode})
                        </>}
                    </p>
                </div>
            </Card>

            {/* Selling Rates Section */}
            <Card className="bg-whatsapp-conversation-bg p-4">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="font-semibold text-red-600">Selling Rate</h3>
                    <span className="text-xs text-whatsapp-text-muted">(When we sell foreign currency to customer)</span>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="sellingCurrentMarketRate">Current Market Selling Rate</Label>
                    <Input
                        id="sellingCurrentMarketRate"
                        type="text"
                        value={sellingRateInput}
                        onChange={handleSellingRateChange}
                        placeholder="0.0000"
                    />
                    <p className="text-xs text-whatsapp-text-muted">
                        This is for reference and powers the live preview below.
                        <br />
                        <span className="text-blue-500">💡 Tip: You can use comma (,) as decimal separator</span>
                        {sellingCurrentMarketRate > 0 && <>
                            <br />
                            (e.g., at this rate, 1 {fromCode} is worth {sellingCurrentMarketRate.toFixed(4)} {toCode})
                        </>}
                    </p>
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
                        <Input
                            type="text"
                            value={fromAmountInput}
                            onChange={handleFromAmountChange}
                            placeholder="0.0000"
                        />
                    </div>
                    <div className='grid gap-2'>
                        <Label>{toCode || "To"}</Label>
                        <Input
                            type="text"
                            value={toAmountInput}
                            onChange={handleToAmountChange}
                            placeholder="0.0000"
                        />
                    </div>
                </div>
                <p className="text-xs text-whatsapp-text-muted mt-2">
                    Preview using {selectedRateType} rate: {(selectedRateType === 'buying' ? buyingCurrentMarketRate : sellingCurrentMarketRate).toFixed(4)}
                </p>
            </Card>

            {buyingCurrentMarketRate <= 0 || sellingCurrentMarketRate <= 0 && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <p>
                        Please set valid rates for both buying and selling.
                    </p>
                </div>
            )}

            <DialogFooter className="flex-shrink-0 pt-4">
                <Button type="submit" className="w-full sm:w-auto">Save Rate</Button>
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
        <div className="h-full flex flex-col bg-whatsapp-chat-bg text-whatsapp-text-primary overflow-hidden">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-whatsapp-panel-bg border-b border-whatsapp-border px-4 py-3 flex-shrink-0 gap-3">
                <h2 className="text-lg font-medium">Exchange Rates</h2>
                <Dialog open={isAddEditDialogOpen} onOpenChange={setAddEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircle className="w-4 h-4 mr-2" /> Add New</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                        <DialogHeader className="flex-shrink-0">
                            <DialogTitle>{selectedRate ? 'Edit' : 'Add'} Exchange Rate</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-120px)]">
                            <div className="pr-4">
                                <RateForm rate={selectedRate} onSave={onFormSaved} />
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pb-8">
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
                                    <p className="font-semibold text-green-600 mb-2">Buying Rate</p>
                                    <p className="text-lg font-semibold">{rate.buyingCurrentMarketRate.toFixed(4)} {rate.toCurrencyCode}</p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        For every 1 {rate.fromCurrencyCode}, we buy {rate.buyingCurrentMarketRate.toFixed(4)} {rate.toCurrencyCode}.
                                    </p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        Market Rate: {rate.buyingCurrentMarketRate.toFixed(4)}
                                    </p>
                                </div>

                                {/* Selling Rates */}
                                <div className="border-l-4 border-red-500 pl-4">
                                    <p className="font-semibold text-red-600 mb-2">Selling Rate</p>
                                    <p className="text-lg font-semibold">{rate.sellingCurrentMarketRate.toFixed(4)} {rate.toCurrencyCode}</p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        For every 1 {rate.fromCurrencyCode}, we sell {rate.sellingCurrentMarketRate.toFixed(4)} {rate.toCurrencyCode}.
                                    </p>
                                    <p className="text-xs text-whatsapp-text-muted">
                                        Market Rate: {rate.sellingCurrentMarketRate.toFixed(4)}
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
