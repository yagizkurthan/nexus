import React from 'react';
import { Search, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="h-20 flex items-center justify-between px-8 mb-8">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold text-white">Data Sources</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="glass-input pl-10 pr-4 py-2 w-64 text-sm focus:w-80 transition-all duration-300"
                        placeholder="Search..."
                    />
                </div>

                <button className="p-2 rounded-full glass-button hover:bg-white/10 transition-colors">
                    <User size={20} className="text-gray-300" />
                </button>
            </div>
        </header>
    );
};

export default Header;
