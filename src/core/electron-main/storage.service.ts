import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Injectable, Autowired } from '@opensumi/di';
import { Domain, isUndefinedOrNull, isUndefined, ThrottledDelayer, IDisposable } from '@opensumi/ide-core-common';
import {
  ElectronMainApiRegistry,
  ElectronMainContribution,
  ElectronMainApiProvider,
} from '@opensumi/ide-core-electron-main/lib/bootstrap/types';

import { ILogService } from '@/logger/common';
import { IStorageService, IEnvironmentService, IStorageData } from '../common/types';

@Injectable()
export class StorageService extends ElectronMainApiProvider implements IStorageService, IDisposable {
	#cache: Record<string, unknown> = Object.create(null);
	#lastContents = '';
	#initializing: Promise<void> | undefined = undefined;
	#closing: Promise<void> | undefined = undefined;
  readonly #flushDelayer = new ThrottledDelayer<void>(100);

  @Autowired(IEnvironmentService)
  environmentService: IEnvironmentService;

	@Autowired(ILogService)
	logService: ILogService

	init(): Promise<void> {
		if (!this.#initializing) {
			this.#initializing = this.doInit();
		}

		return this.#initializing;
	}

	private async doInit() {
		try {
      await fs.mkdir(path.dirname(this.environmentService.storagePath), { recursive: true });
			this.#lastContents = await fs.readFile(this.environmentService.storagePath, 'utf8');
			this.#cache = JSON.parse(this.#lastContents);
		} catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logService.error(error);
      }
		}
	}

	getItem<T>(key: string, defaultValue: T): T;
	getItem<T>(key: string, defaultValue?: T): T | undefined;
	getItem<T>(key: string, defaultValue?: T): T | undefined {
		const res = this.#cache[key];
		if (isUndefinedOrNull(res)) {
			return defaultValue;
		}

		return res as T;
	}

	setItem(key: string, data?: IStorageData): void {
		this.setItems([{ key, data }]);
	}

	setItems(items: readonly { key: string; data?: IStorageData }[]): void {
		let needSave = false;

		for (const { key, data } of items) {
			if (this.#cache[key] === data) continue;
      if (isUndefinedOrNull(data) && isUndefined(this.#cache[key])) continue;
      this.#cache[key] = isUndefinedOrNull(data) ? undefined : data;
      needSave = true
		}

		if (needSave) {
			this.save();
		}
	}

	removeItem(key: string): void {
		if (!isUndefined(this.#cache[key])) {
			this.#cache[key] = undefined;
			this.save();
		}
	}

	private async save(): Promise<void> {
		if (this.#closing) {
			return;
		}

		return this.#flushDelayer.trigger(() => this.doSave());
	}

	private async doSave(): Promise<void> {
		if (!this.#initializing) {
			return;
		}
		await this.#initializing;

		const serializedContent = JSON.stringify(this.#cache, null, 4);
		if (serializedContent === this.#lastContents) {
			return;
		}

		try {
			await fs.writeFile(this.environmentService.storagePath, serializedContent);
			this.#lastContents = serializedContent;
		} catch (error) {
			this.logService.error(error);
		}
	}

	async close(): Promise<void> {
		if (!this.#closing) {
			this.#closing = this.#flushDelayer.trigger(() => this.doSave(), 0);
		}

		return this.#closing;
	}

  dispose(): void {
    this.#flushDelayer.dispose();
  }
}

@Domain(ElectronMainContribution)
export class StorageContribution implements ElectronMainContribution {
  @Autowired(StorageService)
  storageService: StorageService;

  registerMainApi(registry: ElectronMainApiRegistry) {
    registry.registerMainApi(IStorageService, this.storageService);
  }
}
