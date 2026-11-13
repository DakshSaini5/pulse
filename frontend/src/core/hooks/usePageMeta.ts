import { useEffect } from 'react';

export const usePageMeta = (title: string, description?: string) => {
  useEffect(() => {
    document.title = title.includes('Pulse') ? title : `${title} | Pulse`;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);
};
