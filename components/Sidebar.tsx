import React from 'react';
import { ViewMode } from '../types';
import { IconHome, IconHeadphones, IconGrid, IconSearch, IconBookmark } from './Icons';

interface SidebarProps {
    currentMode: ViewMode;
    setMode: (mode: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
    return (
        <aside className="fixed left-0 top-0 bottom-0 w-20 bg-theme-bg flex flex-col items-center py-8 z-50 border-r border-theme-panel">
            {/* Logo */}
            <div className="w-10 h-10 bg-theme-text rounded-xl flex items-center justify-center mb-12 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <span className="font-bold text-black text-xl">EH</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col space-y-8 w-full px-4">
                <NavItem 
                    active={currentMode === ViewMode.DASHBOARD} 
                    onClick={() => setMode(ViewMode.DASHBOARD)}
                    icon={<IconHome className="w-6 h-6" />} 
                />
                <NavItem 
                    active={currentMode === ViewMode.AUDIO} 
                    onClick={() => setMode(ViewMode.AUDIO)}
                    icon={<IconHeadphones className="w-6 h-6" />} 
                />
                 {/* Decorative items to match image */}
                 <NavItem 
                    active={currentMode === ViewMode.SAVED} 
                    onClick={() => setMode(ViewMode.SAVED)}
                    icon={<IconBookmark className="w-6 h-6" />} 
                />
                <div className="w-full h-px bg-theme-panel mx-auto my-4"></div>
                 <NavItem 
                     active={currentMode === ViewMode.COMPARISON} 
                     onClick={() => setMode(ViewMode.COMPARISON)}
                     icon={<IconGrid className="w-6 h-6" />} 
                 />
            </nav>

            {/* User Avatar */}
            <div className="mt-auto">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-theme-gold to-yellow-200 border-2 border-theme-bg"></div>
            </div>
        </aside>
    );
};

const NavItem = ({ active, onClick, icon }: { active: boolean; onClick?: () => void; icon: React.ReactNode }) => (
    <button 
        onClick={onClick}
        className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 relative group
        ${active ? 'text-theme-text' : 'text-theme-muted hover:text-theme-text hover:bg-theme-panel'}`}
    >
        {icon}
        {active && <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-6 bg-theme-text rounded-l-full"></div>}
    </button>
);
