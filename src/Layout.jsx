import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();

  useEffect(() => {
    // First-time visitors: redirect to Home so they see the onboarding tour
    if (!localStorage.getItem('empathy_onboarding_done') && currentPageName !== 'Home') {
      navigate(createPageUrl('Home'));
    }
  }, []);

  return <>{children}</>;
}