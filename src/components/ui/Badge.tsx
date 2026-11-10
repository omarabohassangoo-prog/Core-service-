import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', title }) => {
  return <span className={`badge badge-${variant}`} title={title}>{children}</span>;
};
