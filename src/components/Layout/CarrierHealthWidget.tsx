import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { carrierService, type CarrierHealth, type CarrierSettings } from '../../services/carrierService';
import clsx from 'clsx';


const StatusBox: React.FC<{
    label: string;
    score?: number;
    detail?: { alert: boolean; violations?: number };
}> = ({ label, score, detail }) => {
    let content = <span className="text-gray-400">-</span>;
    let colorClass = "text-gray-400";
    let subText = label;

    if (detail?.alert) {
        content = <AlertTriangle className="w-4 h-4 mx-auto text-red-500" />;
        subText = "Alert";
        colorClass = "text-red-500";
    } else if (score !== undefined) {
        content = <span>{score}</span>;
        if (score >= 75) colorClass = "text-red-500";
        else if (score >= 50) colorClass = "text-yellow-500";
        else colorClass = "text-green-500";
    } else if (detail?.violations !== undefined) {
        content = <span>{detail.violations}</span>;
        subText = `${label} Viols`;
        if (detail.violations > 0) colorClass = "text-yellow-500";
        else colorClass = "text-green-500";
    } else if (detail) {
        content = <CheckCircle className="w-4 h-4 mx-auto text-green-500" />;
        subText = "OK";
        colorClass = "text-green-500";
    }

    return (
        <div className="bg-green-800/30 rounded p-1.5 text-center">
            <div className={clsx("text-sm font-bold flex justify-center items-center h-5", colorClass)}>
                {content}
            </div>
            <p className="text-[9px] text-green-400 truncate">{subText}</p>
        </div>
    );
};

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



    const getStatusIcon = (status: string | undefined) => {
        if (status === 'AUTHORIZED') return <CheckCircle className="w-4 h-4 text-green-500" />;
        if (status === 'NOT AUTHORIZED') return <XCircle className="w-4 h-4 text-red-500" />;
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<CarrierHealth>>({});

    const startEditing = () => {
        if (!health) return;
        setEditForm({
            legalName: health.legalName,
            operatingStatus: health.operatingStatus,
            saferRating: health.saferRating
        });
        setIsEditing(true);
    };

    const saveEditing = async () => {
        if (!health || !settings?.dotNumber) return;

        const updatedHealth = {
            ...health,
            ...editForm,
            // Ensure we keep required fields if they were somehow undefined in editForm
            legalName: editForm.legalName || health.legalName,
            operatingStatus: editForm.operatingStatus || health.operatingStatus
        };

        setHealth(updatedHealth);
        setIsEditing(false);

        // Cache the manual override
        await carrierService.cacheCarrierHealth(updatedHealth);
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

    if (!health && !isEditing) {
        return (
            <div className="p-3">
                <div className="text-xs text-green-300 text-center">
                    <p>Unable to load carrier data</p>
                    <button onClick={handleRefresh} className="underline hover:text-white mr-2">Retry</button>
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
                <div className="flex space-x-1">
                    {!isEditing && (
                        <button
                            onClick={startEditing}
                            className="text-xs text-green-300 hover:text-white px-1"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing || isEditing}
                        className="text-green-300 hover:text-white disabled:opacity-50"
                    >
                        <RefreshCw className={clsx("w-3 h-3", refreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Company Info */}
            {isEditing ? (
                <div className="space-y-2 bg-green-800/50 p-2 rounded">
                    <input
                        className="w-full text-xs bg-green-900 border border-green-700 rounded px-1 py-0.5 text-white"
                        value={editForm.legalName || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, legalName: e.target.value }))}
                        placeholder="Legal Name"
                    />
                    <select
                        className="w-full text-xs bg-green-900 border border-green-700 rounded px-1 py-0.5 text-white"
                        value={editForm.operatingStatus || 'UNKNOWN'}
                        onChange={e => setEditForm(prev => ({ ...prev, operatingStatus: e.target.value }))}
                    >
                        <option value="AUTHORIZED">AUTHORIZED</option>
                        <option value="NOT AUTHORIZED">NOT AUTHORIZED</option>
                        <option value="UNKNOWN">UNKNOWN</option>
                    </select>
                    <div className="flex justify-end space-x-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-300">Cancel</button>
                        <button onClick={saveEditing} className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Save</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-green-800/50 rounded-md p-2">
                        <p className="text-xs text-green-200 truncate">{health?.legalName || settings.companyName}</p>
                        <p className="text-[10px] text-green-400">DOT: {settings.dotNumber}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between bg-green-800/30 rounded-md p-2">
                        <span className="text-xs text-green-200">Status</span>
                        <div className="flex items-center space-x-1">
                            {getStatusIcon(health?.operatingStatus)}
                            <span className="text-xs text-green-100">{health?.operatingStatus}</span>
                        </div>
                    </div>
                </>
            )}

            {/* SAFER Rating */}
            {health?.saferRating && !isEditing && (
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


            {/* CSA Scores / Status */}
            {(health?.csaScores || health?.csaDetails) && !isEditing && (
                <div className="space-y-1">
                    <p className="text-[10px] text-green-400 uppercase tracking-wide">CSA Status</p>
                    <div className="grid grid-cols-2 gap-1">
                        <StatusBox
                            label="Unsafe"
                            score={health.csaScores?.unsafeDriving}
                            detail={health.csaDetails?.unsafeDriving}
                        />
                        <StatusBox
                            label="HOS"
                            score={health.csaScores?.hoursOfService}
                            detail={health.csaDetails?.hoursOfService}
                        />
                        <StatusBox
                            label="Maint"
                            score={health.csaScores?.vehicleMaintenance}
                            detail={health.csaDetails?.vehicleMaintenance}
                        />
                        <StatusBox
                            label="Crash"
                            score={health.csaScores?.crashIndicator}
                            detail={health.csaDetails?.crashIndicator}
                        />
                    </div>
                </div>
            )}


            {/* Fleet Info */}
            {!isEditing && health && (
                <div className="flex justify-between text-[10px] text-green-400 pt-1 border-t border-green-700/50">
                    <span>{health.powerUnits} Power Units</span>
                    <span>{health.drivers} Drivers</span>
                </div>
            )}
        </div>
    );
};


export default CarrierHealthWidget;
