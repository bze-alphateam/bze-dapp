import {getRestURL} from "../Client";
import {BURNER} from "./Burner";
import {getFromCache, setInCache} from "@/services/data_provider/cache";

const MODULE_ADDRESS_KEY = 'auth:module:address:';
const BALANCES_CACHE_TTL = 60 * 60 * 48; //48 hours

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
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed.address;
            }
        }

        const url = getRestURL();
        let response = await fetch(`${url}/cosmos/auth/v1beta1/module_accounts/${module}`)
        if (!response.ok) {
            return "testbz18hsqalgwlzqavrrkfnxmrjmygwyjy8se37kq3x";
        }

        let parsed = await response.json()
        //@ts-ignore
        let addy = parsed.account.base_account?.address;
        if (addy === undefined) {
            return "testbz18hsqalgwlzqavrrkfnxmrjmygwyjy8se37kq3x";
        }

        setInCache(cacheKey, JSON.stringify(addy), BALANCES_CACHE_TTL);

        return addy;
    } catch (e) {
        console.error(e);

        return '';
    }
}
