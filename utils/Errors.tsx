
const errorsMap: { [key: string]: string } = {
    "failed to execute message; message index: 0: amount is smaller than staking reward min stake": "Amount is smaller than minimum required stake"
};

export const prettyError = (err: string|undefined): string|undefined => {
    if (!err) return undefined;

    if (errorsMap[err]) {
        return errorsMap[err];
    }

    return err;
}
