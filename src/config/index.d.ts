import { proxy } from './proxy';
export declare const isDev: any;
/** 统一配置 */
export declare const config: {
    app: {
        name: string;
        desc: string;
        menu: {
            isGroup: boolean;
        };
        router: {
            mode: "history";
        };
    };
    ignore: {
        /** 不弹 toast 的路径片段 */
        toast: string[];
        /** 无需登录 */
        token: string[];
    };
    test: {
        eps: any;
    };
    host: "http://127.0.0.1:3000";
    baseUrl: string;
};
export { proxy };
export type ProxyMap = typeof proxy;
export default config;
