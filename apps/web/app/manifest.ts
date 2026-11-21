import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClipGlass Media',
    short_name: 'ClipGlass',
    description: 'Fast, clean YouTube media extraction in Apple-style liquid glass',
    start_url: '/',
    display: 'standalone',
    background_color: '#E9ECF3',
    theme_color: '#E9ECF3',
    share_target: {
      action: '/?url=',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    } as any,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

