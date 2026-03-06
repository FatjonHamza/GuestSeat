import React from 'react';
import { motion } from 'motion/react';
import { GuestGroup, Table } from './types';

export const INITIAL_GROUPS: GuestGroup[] = [];
export const INITIAL_TABLES: Table[] = [];

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  accent: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Ar i Mesnatës',
    primary: '#F27D26',
    secondary: '#141414',
    bg: '#0a0502',
    text: '#FFFFFF',
    accent: 'rgba(242, 125, 38, 0.2)'
  },
  {
    id: 'romantic',
    name: 'Rozë e Ëmbël',
    primary: '#E8A0BF',
    secondary: '#F5F5F0',
    bg: '#FFF0F5',
    text: '#4A4A40',
    accent: 'rgba(232, 160, 191, 0.2)'
  },
  {
    id: 'elegant',
    name: 'Kopshti i Sherbelës',
    primary: '#84A59D',
    secondary: '#F7F7F7',
    bg: '#F0F4F3',
    text: '#354F52',
    accent: 'rgba(132, 165, 157, 0.2)'
  },
  {
    id: 'modern',
    name: 'Argjend Detar',
    primary: '#A8DADC',
    secondary: '#1D3557',
    bg: '#1D3557',
    text: '#F1FAEE',
    accent: 'rgba(168, 218, 220, 0.2)'
  }
];

export const InvitationVector = ({ primary, secondary }: { primary: string; secondary: string }) => (
  <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
    {/* Geometric Frame */}
    <path 
      d="M20,20 L380,20 L380,580 L20,580 Z M40,40 L360,40 L360,560 L40,560 Z" 
      fill="none" 
      stroke={primary} 
      strokeWidth="1" 
      opacity="0.3"
    />
    <path 
      d="M0,100 L100,0 M300,0 L400,100 M400,500 L300,600 M100,600 L0,500" 
      stroke={primary} 
      strokeWidth="2" 
      opacity="0.5"
    />
    
    {/* Floral Elements (Simplified Cherry Blossoms) */}
    <g transform="translate(320, 100)">
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <path 
          key={i}
          d="M0,0 C10,-20 30,-20 40,0 C30,20 10,20 0,0" 
          fill={primary} 
          transform={`rotate(${angle})`}
          opacity={0.6 + (i * 0.05)}
        />
      ))}
      <circle cx="0" cy="0" r="5" fill={secondary} />
    </g>

    <g transform="translate(350, 250) scale(0.7)">
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <path 
          key={i}
          d="M0,0 C15,-25 45,-25 60,0 C45,25 15,25 0,0" 
          fill={primary} 
          transform={`rotate(${angle})`}
          opacity={0.5}
        />
      ))}
      <circle cx="0" cy="0" r="8" fill={secondary} />
    </g>

    {/* Falling Petals */}
    <motion.path 
      animate={{ y: [0, 100], x: [0, 20], rotate: [0, 360] }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      d="M300,400 C305,390 315,390 320,400 C315,410 305,410 300,400" 
      fill={primary} 
      opacity="0.4"
    />
    <motion.path 
      animate={{ y: [0, 150], x: [0, -30], rotate: [0, -360] }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
      d="M350,350 C355,340 365,340 370,350 C365,360 355,360 350,350" 
      fill={primary} 
      opacity="0.3"
    />

    {/* Bee (Simplified) */}
    <g transform="translate(340, 180) rotate(-30)">
      <ellipse cx="0" cy="0" rx="10" ry="6" fill="#F2D026" />
      <path d="M-4,-5 L-4,5 M0,-6 L0,6 M4,-5 L4,5" stroke="#000" strokeWidth="2" />
      <path d="M-2,-6 C-10,-15 0,-15 2,-6" fill="rgba(255,255,255,0.6)" />
      <path d="M-2,6 C-10,15 0,15 2,6" fill="rgba(255,255,255,0.6)" />
    </g>
  </svg>
);
