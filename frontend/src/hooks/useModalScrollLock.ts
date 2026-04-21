import { useEffect } from 'react';
import { appKit } from '@/config/walletConfig';

// Locks body scroll while the AppKit wallet modal is open.
export const useModalScrollLock = () => {
    useEffect(() => {
        const unsubscribe = appKit.subscribeEvents((event) => {
            if (event.data.event === 'MODAL_OPEN') {
                document.body.style.overflow = 'hidden';
            } else if (event.data.event === 'MODAL_CLOSE') {
                document.body.style.overflow = '';
            }
        });

        return () => {
            unsubscribe();
            document.body.style.overflow = '';
        };
    }, []);
};
