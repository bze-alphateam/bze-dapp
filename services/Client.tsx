
import { bze } from '@bze/bzejs';

function getRestURL(): string {
  return process.env.NEXT_PUBLIC_REST_URL !== undefined ? process.env.NEXT_PUBLIC_REST_URL : '';
}

export async function getRestClient() {
  return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
}