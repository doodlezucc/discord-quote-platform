import { base } from '$app/paths';
import { eq } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import { db } from './db';
import * as table from './db/schema';
import { generateUniqueString } from './util/generate-string';

type PartialAsset = {
	path: string;
};

export class AssetManager {
	private readonly directoryName = 'user-media';
	readonly rootDirFromFrontend: string = `${base}/${this.directoryName}`;
	readonly rootDirFromBackend: string = `./static/${this.directoryName}`;

	constructor() {
		this.createStaticDirectory();
	}

	private async createStaticDirectory() {
		await fs.mkdir(this.rootDirFromBackend, { recursive: true });
	}

	async getPathToAsset(assetId: string, { accessibleByFrontend = false }) {
		const [asset = undefined] = await db
			.select({ path: table.asset.path })
			.from(table.asset)
			.where(eq(table.asset.id, assetId));

		if (!asset) {
			throw new Error(`Asset ${assetId} not found`);
		}

		return this.getPathToFile(asset.path, accessibleByFrontend);
	}

	private getPathToFile(fileName: string, accessibleByFrontend = false) {
		const root = accessibleByFrontend ? this.rootDirFromFrontend : this.rootDirFromBackend;

		return `${root}/${fileName}`;
	}

	async uploadAsset(uploaderId: string, request: Request): Promise<table.Asset> {
		const contentType = request.headers.get('Content-Type');

		if (!contentType) {
			throw 'Asset upload failed because Content-Type header is not set';
		}

		const fileExtension = mime.extension(contentType);
		if (!fileExtension) {
			throw 'Asset upload failed because MIME type could not be recognized';
		}

		const fileName = await generateUniqueString({
			length: 8,
			map: (id) => `${id}.${fileExtension}`,
			doesExist: async (fileName) => {
				try {
					const pathToAsset = this.getPathToFile(fileName);
					await fs.access(pathToAsset);
					return true;
				} catch {
					return false;
				}
			}
		});

		const buffer = await request.arrayBuffer();

		const systemPath = this.getPathToFile(fileName);
		await fs.writeFile(systemPath, new Uint8Array(buffer));

		const storedAsset: table.Asset = {
			id: crypto.randomUUID(),
			createdBy: uploaderId,
			mimeType: contentType,
			path: fileName
		};

		await db.insert(table.asset).values(storedAsset);

		console.log('Created asset ' + fileName);
		return storedAsset;
	}

	async disposeAsset(asset: PartialAsset) {
		const filePath = this.getPathToFile(asset.path);
		await fs.unlink(filePath);
	}

	async disposeAssetsInBatch(assets: PartialAsset[]) {
		await Promise.allSettled(assets.map((asset) => this.disposeAsset(asset)));
	}
}
