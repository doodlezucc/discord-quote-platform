import { base } from '$app/paths';
import { eq, inArray } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import { Readable } from 'stream';
import type { ReadableStream } from 'stream/web';
import { db } from './db';
import * as table from './db/schema';
import { generateUniqueString } from './util/generate-string';

interface PartialAsset {
	id: string;
	path: string;
}

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

	resolveAssetPath(assetPath: string, options?: { accessibleByBackend: boolean }) {
		return this.getPathToFile(assetPath, options ? !options.accessibleByBackend : true);
	}

	private getPathToFile(fileName: string, accessibleByFrontend = false) {
		const root = accessibleByFrontend ? this.rootDirFromFrontend : this.rootDirFromBackend;

		return `${root}/${fileName}`;
	}

	async uploadAsset(uploaderId: string, request: Request): Promise<table.Asset> {
		const contentType = request.headers.get('Content-Type');

		if (!contentType) {
			throw new Error('Asset upload failed because Content-Type header is not set');
		}

		const fileExtension = mime.extension(contentType);
		if (!fileExtension) {
			throw new Error('Asset upload failed because MIME type could not be recognized');
		}

		return await this.createAsset(
			uploaderId,
			Readable.fromWeb(request.body! as ReadableStream),
			contentType,
			fileExtension
		);
	}

	async createAsset(
		uploaderId: string,
		stream: Readable,
		contentType: string,
		fileExtension: string
	): Promise<table.Asset> {
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

		const systemPath = this.getPathToFile(fileName);
		fs.writeFile(systemPath, stream, { flush: true }).catch(() => {});

		await new Promise<void>((resolve, reject) =>
			stream
				.once('end', () => resolve())
				.once('error', (err) => {
					fs.unlink(systemPath).catch((reason) => reject(reason));
					reject(err);
				})
		);

		const storedAsset: table.Asset = {
			id: crypto.randomUUID(),
			createdBy: uploaderId,
			mimeType: contentType,
			path: fileName
		};

		await db.insert(table.asset).values(storedAsset);

		console.log(`Created asset ${fileName} of type ${contentType}`);
		return storedAsset;
	}

	async deleteAsset(asset: PartialAsset) {
		await this.disposeAssetFile(asset.path);
		await db.delete(table.asset).where(eq(table.asset.id, asset.id));
	}

	async deleteAssetsInBatch(assets: PartialAsset[]) {
		const allAssetIds = assets.map((asset) => asset.id);
		const allAssetPaths = assets.map((asset) => asset.path);

		await db.delete(table.asset).where(inArray(table.asset.id, allAssetIds));
		await this.disposeAssetFilesInBatch(allAssetPaths);
	}

	private async disposeAssetFile(assetPath: string) {
		const filePath = this.getPathToFile(assetPath);
		await fs.unlink(filePath);
	}

	private async disposeAssetFilesInBatch(assetPaths: string[]) {
		await Promise.allSettled(assetPaths.map((asset) => this.disposeAssetFile(asset)));
	}
}
