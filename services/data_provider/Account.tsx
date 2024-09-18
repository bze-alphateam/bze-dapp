import {getRestClient, getRestURL} from "../Client";
import { BURNER } from "./Burner";

const MODULE_ADDRESS_KEY = 'auth:module:address:';
const BALANCES_CACHE_TTL = 1000 * 60 * 60 * 48; //48 hours

function getHardcodedBurnerAddress(): string {
  if (process.env.NEXT_PUBLIC_CHAIN_ID === 'beezee-1') {
    return 'bze1v7uw4xhrcv0vk7qp8jf9lu3hm5d8uu5yjp5qun';
  }

  return 'testbz1v7uw4xhrcv0vk7qp8jf9lu3hm5d8uu5ysekt99';
}

export async function getModuleAddress(module: string): Promise<string> {
  //save some requests
  if (module === BURNER) {
    return getHardcodedBurnerAddress();
  }

  try {
    const cacheKey = `${MODULE_ADDRESS_KEY}${module}`;
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<string> ((resolve) => {
                    resolve(parsed.address);
                })
            }
        }
    }

    const url = getRestURL();
    let response = await fetch(`${url}/cosmos/auth/v1beta1/module_accounts/${module}`)
    if (!response.ok) {
        return "testbz18hsqalgwlzqavrrkfnxmrjmygwyjy8se37kq3x";
    }

    let parsed = await response.json()
    {/* @ts-ignore */}
    let addy = parsed.account.base_account?.address;
    if (addy === undefined) {
        return "testbz18hsqalgwlzqavrrkfnxmrjmygwyjy8se37kq3x";
    }
    
    let cacheData = {
        address: addy,
        expiresAt: new Date().getTime() + BALANCES_CACHE_TTL,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return new Promise<string> ((resolve) => {
        resolve(addy);
    })
  } catch(e) {
    console.error(e);

    return '';
  }
}
