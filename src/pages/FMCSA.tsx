import React, { useState } from 'react';
import { Search, BookOpen, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';


interface RegulationPart {
    id: string;
    part: string;
    title: string;
    summary: string;
    sections: {
        code: string;
        title: string;
        description: string;
    }[];
}

const regulations: RegulationPart[] = [
    {
        id: '395',
        part: 'Part 395',
        title: 'Hours of Service of Drivers',
        summary: 'Regulations prescribing the maximum driving hours for commercial motor vehicle drivers.',
        sections: [
            { code: '395.3', title: 'Maximum driving time', description: 'Limits 11 hours driving after 10 consecutive hours off duty. 14-hour duty window.' },
            { code: '395.8', title: 'Driver\'s record of duty status', description: 'Requirements for maintaining a log of duty status (RODS) or ELD records.' },
            { code: '395.1', title: 'Scope of rules in this part', description: 'Exceptions and exemptions including short-haul and adverse driving conditions.' }
        ]
    },
    {
        id: '391',
        part: 'Part 391',
        title: 'Qualifications of Drivers',
        summary: 'Rules establishing minimum qualifications for persons who drive commercial motor vehicles.',
        sections: [
            { code: '391.11', title: 'General qualifications of drivers', description: 'Must be 21 years old, speak English, and be physically qualified.' },
            { code: '391.41', title: 'Physical qualifications', description: 'Medical certification requirements for drivers.' },
            { code: '391.51', title: 'General driver qualification files', description: 'Record keeping requirements for driver qualification files (DQFs).' }
        ]
    },
    {
        id: '396',
        part: 'Part 396',
        title: 'Inspection, Repair, and Maintenance',
        summary: 'Requirements for inspecting, repairing, and maintaining commercial motor vehicles.',
        sections: [
            { code: '396.11', title: 'Driver vehicle inspection report(s)', description: 'Requirement for post-trip inspection reports (DVIR).' },
            { code: '396.17', title: 'Periodic inspection', description: 'Mandatory annual inspection requirements.' },
            { code: '396.3', title: 'Inspection, repair, and maintenance', description: 'General requirement to systematically inspect, repair, and maintain vehicles.' }
        ]
    },
    {
        id: '383',
        part: 'Part 383',
        title: 'Commercial Driver\'s License Standards',
        summary: 'Standards for Commercial Driver\'s License (CDL) including testing and classification.',
        sections: [
            { code: '383.23', title: 'Commercial driver\'s license', description: 'Requirement to possess a valid CDL.' },
            { code: '383.51', title: 'Disqualification of drivers', description: 'Grounds for suspending or revoking a CDL.' },
            { code: '383.91', title: 'Commercial motor vehicle groups', description: 'Definitions of Class A, B, and C vehicles.' }
        ]
    }
];

const FMCSA: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedPartId, setExpandedPartId] = useState<string | null>('395');

    const filteredRegulations = regulations.filter(reg =>
        reg.part.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.sections.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const togglePart = (id: string) => {
        setExpandedPartId(expandedPartId === id ? null : id);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">FMCSA Rules & Regulations</h2>
                    <p className="text-gray-500 mt-1">Quick reference for key Federal Motor Carrier Safety Administration regulations.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 border border-blue-200">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit FMCSA.dot.gov
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full max-w-lg">
                    <Search className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search regulation codes, titles, or descriptions..."
                        className="text-sm w-full focus:outline-none bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredRegulations.length > 0 ? (
                    filteredRegulations.map((reg) => (
                        <div key={reg.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => togglePart(reg.id)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{reg.part}: {reg.title}</h3>
                                        <p className="text-sm text-gray-500">{reg.summary}</p>
                                    </div>
                                </div>
                                {expandedPartId === reg.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                            </div>

                            {expandedPartId === reg.id && (
                                <div
                                    className="border-t border-gray-200 bg-gray-50 p-4 space-y-3"
                                >
                                    <div className="mb-2">
                                        <a
                                            href={`https://www.ecfr.gov/current/title-49/part-${reg.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                        >
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View Full Part {reg.id} on eCFR
                                        </a>
                                    </div>
                                    {reg.sections.map((section) => (
                                        <div key={section.code} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm ml-14">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <a
                                                        href={`https://www.ecfr.gov/current/title-49/section-${section.code}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded mb-1 hover:bg-gray-200"
                                                    >
                                                        § {section.code}
                                                    </a>
                                                    <h4 className="text-sm font-bold text-gray-900">{section.title}</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        No regulations found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
};

export default FMCSA;
