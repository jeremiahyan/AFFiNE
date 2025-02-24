import { wrapCreateBrowserRouter } from '@sentry/react';
import { createContext, useEffect, useState } from 'react';
import type { NavigateFunction, RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  Outlet,
  useLocation,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useNavigate,
} from 'react-router-dom';

import { mixpanel } from './utils';

export const NavigateContext = createContext<NavigateFunction | null>(null);

function RootRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // a hack to make sure router is ready
    setReady(true);
  }, []);

  useEffect(() => {
    mixpanel.track_pageview({
      page: location.pathname,
      appVersion: runtimeConfig.appVersion,
      environment: runtimeConfig.appBuildType,
      editorVersion: runtimeConfig.editorVersion,
      isSelfHosted: Boolean(runtimeConfig.isSelfHosted),
    });
  }, [location]);
  return (
    ready && (
      <NavigateContext.Provider value={navigate}>
        <Outlet />
      </NavigateContext.Provider>
    )
  );
}

export const topLevelRoutes = [
  {
    element: <RootRouter />,
    children: [
      {
        path: '/',
        lazy: () => import('./pages/index'),
      },
      {
        path: '/workspace/:workspaceId/*',
        lazy: () => import('./pages/workspace/index'),
      },
      {
        path: '/share/:workspaceId/:pageId',
        lazy: () => import('./pages/share/share-detail-page'),
      },
      {
        path: '/404',
        lazy: () => import('./pages/404'),
      },
      {
        path: '/auth/:authType',
        lazy: () => import('./pages/auth'),
      },
      {
        path: '/expired',
        lazy: () => import('./pages/expired'),
      },
      {
        path: '/invite/:inviteId',
        lazy: () => import('./pages/invite'),
      },
      {
        path: '/signIn',
        lazy: () => import('./pages/sign-in'),
      },
      {
        path: '/open-app/:action',
        lazy: () => import('./pages/open-app'),
      },
      {
        path: '/upgrade-success',
        lazy: () => import('./pages/upgrade-success'),
      },
      {
        path: '/desktop-signin',
        lazy: () => import('./pages/desktop-signin'),
      },
      {
        path: '/onboarding',
        lazy: () => import('./pages/onboarding'),
      },
      {
        path: '/redirect-proxy',
        lazy: () => import('./pages/redirect'),
      },
      {
        path: '/subscribe',
        lazy: () => import('./pages/subscribe'),
      },
      {
        path: '*',
        lazy: () => import('./pages/404'),
      },
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];

export const viewRoutes = [
  {
    path: '/all',
    lazy: () => import('./pages/workspace/all-page/all-page'),
  },
  {
    path: '/collection',
    lazy: () => import('./pages/workspace/all-collection'),
  },
  {
    path: '/collection/:collectionId',
    lazy: () => import('./pages/workspace/collection/index'),
  },
  {
    path: '/tag',
    lazy: () => import('./pages/workspace/all-tag'),
  },
  {
    path: '/tag/:tagId',
    lazy: () => import('./pages/workspace/tag'),
  },
  {
    path: '/trash',
    lazy: () => import('./pages/workspace/trash-page'),
  },
  {
    path: '/:pageId',
    lazy: () => import('./pages/workspace/detail-page/detail-page'),
  },
  {
    path: '*',
    lazy: () => import('./pages/404'),
  },
] satisfies [RouteObject, ...RouteObject[]];

const createBrowserRouter = wrapCreateBrowserRouter(
  reactRouterCreateBrowserRouter
);
export const router = createBrowserRouter(topLevelRoutes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
