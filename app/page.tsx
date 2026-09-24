import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically route users from the root URL to the dashboard
  redirect('/products');
}