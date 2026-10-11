'use client';

import React, { ReactNode } from 'react';
import { SiteChrome, SiteAction } from './SiteChrome';

interface PublicChromeProps {
  children: ReactNode;
  auth?: boolean;
  headerAction?: SiteAction;
  footerAction?: SiteAction;
  className?: string;
  showNav?: boolean;
}

export function PublicChrome({
  children,
  headerAction,
  footerAction,
  className,
  showNav = true,
}: PublicChromeProps) {
  return (
    <SiteChrome
      headerAction={headerAction}
      footerAction={footerAction}
      className={className}
      showNav={showNav}
    >
      {children}
    </SiteChrome>
  );
}
