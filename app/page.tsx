import { redirect } from 'next/navigation';

// The middleware handles locale detection and redirects, but this is a
// safety net for any direct hits to "/" that slip through.
export default function RootPage() {
  redirect('/en');
}
