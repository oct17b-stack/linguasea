import { Redirect } from 'expo-router';

/** An unknown address (a typed or stale URL on the web) goes home instead of the router's English error page. */
export default function NotFound() {
  return <Redirect href="/" />;
}
