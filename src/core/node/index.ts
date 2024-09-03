import { NodeModule } from '@opensumi/ide-core-node';
import { Injectable } from '@opensumi/di';

@Injectable()
export class CoreNodeModule extends NodeModule {
  providers = [];
}
