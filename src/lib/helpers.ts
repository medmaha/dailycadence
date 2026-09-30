const assertNumber = (name: string, original: any) => {
    const _value = Number(original);
    if (!Number.isNaN(_value)) return _value;
    throw new Error(
        `[ValueError] The value "${name}" expects number, but received ${original}->${typeof original}`,
    );
};

export const readEnvAndParseNumber = (envName: string, defaultValue?: any) => {
    const value = readEnv(envName, defaultValue);
    return assertNumber(envName, value);
};

export const readEnv = (envName: string, defaultValue?: any): string => {
    return (process.env[envName] ?? defaultValue) || "";
};

export const isDev = () => {
    return readEnv("NODE_ENV") === "development";
};
export const isProd = () => {
    return readEnv("NODE_ENV") === "production";
};
