declare module "@agentic-trust/core/server" {
  export function getDiscoveryClient(): Promise<any>;
  export function getChainBundlerUrl(chainId: number): string;
  export const sepolia: any;
}


