import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { carrierService, type CarrierHealth, type CarrierSettings } from '../../services/carrierService';
import clsx from 'clsx';

const CarrierHealthWidget: React.FC = () => {
    const [settings, setSettings] = useState<CarrierSettings | null>(null);
    const [health, setHealth] = useState<CarrierHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadCarrierData();
    }, []);

    const loadCarrierData = async () => {
        try {
            const carrierSettings = await carrierService.getCarrierSettings();
            setSettings(carrierSettings);

            if (carrierSettings?.dotNumber) {
                // Try to get real data, fallback to mock for demo
                let healthData = await carrierService.fetchCarrierHealth(carrierSettings.dotNumber);
                if (!healthData) {
                    healthData = carrierService.getMockCarrierHealth(carrierSettings.dotNumber);
                }
                setHealth(healthData);
            }
        } catch (error) {
            console.error('Failed to load carrier data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!settings?.dotNumber) return;
        setRefreshing(true);
        try {
            const healthData = carrierService.getMockCarrierHealth(settings.dotNumber);
            setHealth(healthData);
        } finally {
            setRefreshing(false);
        }
    };

    const getScoreColor = (score: number | undefined) => {
        if (!score) return 'text-gray-400';
        if (score >= 75) return 'text-red-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getStatusIcon = (status: string | undefined) => {
        if (status === 'AUTHORIZED') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'NOT AUTHORIZED') return <XCircle className="w-4 h-4 text-red-500" />;
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    };

    if (loading) {
        return (
            <div className="p-3 text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400 mx-auto"></div>
            </div>
        );
    }

    if (!settings?.dotNumber) {
        return (
            <div className="p-3">
                <div className="text-xs text-green-300 text-center">
                    <p>No USDOT configured</p>
                    <a href="/settings" className="underline hover:text-white">Add in Settings</a>
                </div>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="p-3">
                <div className="text-xs text-green-300 text-center">
                    <p>Unable to load carrier data</p>
                    <button onClick={handleRefresh} className="underline hover:text-white">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-green-100">Carrier Health</span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-green-300 hover:text-white disabled:opacity-50"
                >
                    <RefreshCw className={clsx("w-3 h-3", refreshing && "animate-spin")} />
                </button>
            </div>

            {/* Company Info */}
            <div className="bg-green-800/50 rounded-md p-2">
                <p className="text-xs text-green-200 truncate">{health.legalName || settings.companyName}</p>
                <p className="text-[10px] text-green-400">DOT: {health.dotNumber}</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between bg-green-800/30 rounded-md p-2">
                <span className="text-xs text-green-200">Status</span>
                <div className="flex items-center space-x-1">
                    {getStatusIcon(health.operatingStatus)}
                    <span className="text-xs text-green-100">{health.operatingStatus}</span>
                </div>
            </div>

            {/* SAFER Rating */}
            {health.saferRating && (
                <div className="flex items-center justify-between bg-green-800/30 rounded-md p-2">
                    <span className="text-xs text-green-200">SAFER Rating</span>
                    <span className={clsx(
                        "text-xs font-semibold px-2 py-0.5 rounded",
                        health.saferRating === 'SATISFACTORY' ? "bg-green-600 text-white" :
                            health.saferRating === 'CONDITIONAL' ? "bg-yellow-600 text-white" :
                                "bg-red-600 text-white"
                    )}>
                        {health.saferRating}
                    </span>
                </div>
            )}

            {/* CSA Scores */}
            {health.csaScores && (
                <div className="space-y-1">
                    <p className="text-[10px] text-green-400 uppercase tracking-wide">CSA Scores</p>
                    <div className="grid grid-cols-2 gap-1">
                        {health.csaScores.unsafeDriving !== undefined && (
                            <div className="bg-green-800/30 rounded p-1.5 text-center">
                                <p className={clsx("text-sm font-bold", getScoreColor(health.csaScores.unsafeDriving))}>
                                    {health.csaScores.unsafeDriving}
                                </p>
                                <p className="text-[9px] text-green-400">Unsafe</p>
                            </div>
                        )}
                        {health.csaScores.hoursOfService !== undefined && (
                            <div className="bg-green-800/30 rounded p-1.5 text-center">
                                <p className={clsx("text-sm font-bold", getScoreColor(health.csaScores.hoursOfService))}>
                                    {health.csaScores.hoursOfService}
                                </p>
                                <p className="text-[9px] text-green-400">HOS</p>
                            </div>
                        )}
                        {health.csaScores.vehicleMaintenance !== undefined && (
                            <div className="bg-green-800/30 rounded p-1.5 text-center">
                                <p className={clsx("text-sm font-bold", getScoreColor(health.csaScores.vehicleMaintenance))}>
                                    {health.csaScores.vehicleMaintenance}
                                </p>
                                <p className="text-[9px] text-green-400">Maint</p>
                            </div>
                        )}
                        {health.csaScores.crashIndicator !== undefined && (
                            <div className="bg-green-800/30 rounded p-1.5 text-center">
                                <p className={clsx("text-sm font-bold", getScoreColor(health.csaScores.crashIndicator))}>
                                    {health.csaScores.crashIndicator}
                                </p>
                                <p className="text-[9px] text-green-400">Crash</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fleet Info */}
            <div className="flex justify-between text-[10px] text-green-400 pt-1 border-t border-green-700/50">
                <span>{health.powerUnits} Power Units</span>
                <span>{health.drivers} Drivers</span>
            </div>
        </div>
    );
};

export default CarrierHealthWidget;
