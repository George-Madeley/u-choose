import { forwardRef, useCallback, useMemo } from "react";
import {
  Link as ReactRouterLink,
  useLocation,
  useNavigate,
} from "react-router";

import type { LinkProps } from "@mui/material";
import {
  AppProvider,
  type AppProviderProps,
  type Navigate,
  type Router,
} from "@toolpad/core";
import { mapProperties } from "@toolpad/utils/collections";

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkRef(props, ref) {
    const { href, ...rest } = props;
    return <ReactRouterLink ref={ref} to={href ?? ""} {...rest} />;
  }
);

export default function ReactRouterAppProvider(props: AppProviderProps) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // TansStack Router's search automatically parses stringified values, which is incompatible with our standard implementation.
  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        mapProperties(search, ([key, value]: [key: string, value: unknown]) => [
          key,
          JSON.stringify(value),
        ])
      ),
    [search]
  );

  const navigateImpl = useCallback<Navigate>(
    (url, { history = "auto" } = {}) => {
      if (history === "auto" || history === "push") {
        return navigate(url);
      }
      if (history === "replace") {
        return navigate(url, { replace: true });
      }
      throw new Error(`Invalid history option: ${history}`);
    },
    [navigate]
  );

  const routerImpl = useMemo<Router>(
    () => ({
      pathname,
      searchParams,
      navigate: navigateImpl,
      Link,
    }),
    [navigateImpl, pathname, searchParams]
  );

  return <AppProvider router={routerImpl} {...props} />;
}
