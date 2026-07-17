/** 环境代理（dev / prod 前缀经 Vite 或网关转发到 target） */
export declare const proxy: {
    readonly '/dev/': {
        readonly target: "http://127.0.0.1:3000";
        readonly changeOrigin: true;
        readonly xfwd: true;
        readonly rewrite: (path: string) => string;
    };
    readonly '/prod/': {
        readonly target: "http://127.0.0.1:3000";
        readonly changeOrigin: true;
        readonly xfwd: true;
        readonly rewrite: (path: string) => string;
    };
    /** 微应用静态资源（子应用内绝对路径 /vome/apps/...） */
    readonly '/vome/': {
        readonly target: "http://127.0.0.1:3000";
        readonly changeOrigin: true;
        readonly xfwd: true;
    };
};
