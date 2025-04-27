import { AssetManager } from './asset-manager';

class ServerStack {
	readonly assetManager = new AssetManager();
}

export const server = new ServerStack();
